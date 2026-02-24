const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const cache = require('./cache');

// JWT 密钥：生产环境必须在 Render 环境变量中设置 JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';
const JWT_EXPIRES_IN = '24h';

/** 生成 JWT Token */
const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/** 验证密码（兼容明文和 bcrypt 哈希两种格式） */
const checkPassword = async (plain, stored) => {
  // 如果已存储的是 bcrypt 哈希（以 $2 开头），用 bcrypt 比对
  if (stored && stored.startsWith('$2')) {
    return bcrypt.compare(plain, stored);
  }
  // 否则按明文比对（迁移期兼容）
  return plain === stored;
};

/** 哈希密码 */
const hashPassword = async (plain) => {
  return bcrypt.hash(plain, 10);
};

/** JWT 认证中间件 - 验证用户Token */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, msg: '请先登录' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (jwtError) {
      return res.status(401).json({ code: 401, msg: 'Token无效或已过期' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ code: 500, msg: '认证失败' });
  }
};

// 验证管理员权限的中间件
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, msg: '未授权访问' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ code: 403, msg: '需要管理员权限' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, msg: '无效的Token' });
  }
};

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Graceful shutdown so Prisma disconnects cleanly (helps free Supabase connections)
const shutdown = async () => {
  console.log('shutting down server, disconnecting prisma...');
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', async (err) => {
  console.error('uncaughtException', err);
  await shutdown();
});

// Serve static files (frontend)
const publicPath = path.join(__dirname, '../public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  
  // Serve index.html for root path and all non-API routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
  
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Helper function to highlight keyword in text
const highlightKeyword = (text, keyword) => {
  if (!keyword || !text) return { text, highlighted: text };
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const highlighted = text.replace(regex, '<<HIGHLIGHT>>$1<<END>>');
  return { text, highlighted };
};

// Homestays - 支持高级搜索和筛选
app.get('/api/homestays', async (req, res) => {
  try {
    const { 
      category, 
      keyword, 
      minPrice, 
      maxPrice, 
      bedrooms, 
      amenities, 
      sortBy,
      checkIn,
      checkOut,
      guests
    } = req.query;
    
    // 可选：解析用户 token 以获取收藏状态
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // Token 无效，继续作为未登录用户处理
      }
    }
    
    // 构建 Prisma 查询条件
    const where = {};
    
    // 关键词搜索（标题、位置、描述）
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { location: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    
    // 分类筛选
    if (category && category !== 'all') {
      where.type = category;
    }
    
    // 价格范围筛选
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice);
      if (maxPrice) where.price.lte = parseInt(maxPrice);
    }
    
    // 卧室数量筛选（房型）
    if (bedrooms) {
      where.bedrooms = { gte: parseInt(bedrooms) };
    }
    
    // 设施筛选（数组包含）
    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim()).filter(Boolean);
      if (amenityList.length > 0) {
        where.amenities = { hasEvery: amenityList };
      }
    }
    
    // 客人数量筛选
    if (guests) {
      where.guests = { gte: parseInt(guests) };
    }

    // 构建排序
    let orderBy = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const homestays = await prisma.homestay.findMany({
      where,
      orderBy,
      include: {
        stocks: true,
      },
    });
    
    // 如果用户已登录，获取用户的收藏列表
    let userFavorites = new Set();
    if (userId) {
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        select: { houseId: true },
      });
      userFavorites = new Set(favorites.map(f => f.houseId));
    }
    
    // 获取所有房源的评价统计
    const homestayIds = homestays.map(h => h.id);
    const reviewStats = await prisma.review.groupBy({
      by: ['houseId'],
      where: { houseId: { in: homestayIds }, status: 'active' },
      _avg: { rating: true },
      _count: { id: true },
    });
    
    const reviewStatsMap = {};
    reviewStats.forEach(r => {
      reviewStatsMap[r.houseId] = {
        rating: Math.round((r._avg.rating || 0) * 10) / 10,
        count: r._count.id,
      };
    });
    
    // Transform to match frontend format
    const formatted = homestays.map(h => {
      // 生成高亮文本
      const titleHighlight = highlightKeyword(h.title, keyword);
      const locationHighlight = highlightKeyword(h.location, keyword);
      const descriptionHighlight = highlightKeyword(h.description, keyword);
      
      const stats = reviewStatsMap[h.id] || { rating: 0, count: 0 };
      
      return {
        id: h.id,
        title: h.title,
        location: h.location,
        price: h.price,
        rating: stats.rating,
        reviews: stats.count,
        images: h.images,
        type: h.type,
        guests: h.guests,
        bedrooms: h.bedrooms,
        beds: h.beds,
        bathrooms: h.bathrooms,
        amenities: h.amenities,
        description: h.description,
        isFavorite: userId ? userFavorites.has(h.id) : false,
        // 高亮字段
        highlightedTitle: titleHighlight.highlighted,
        highlightedLocation: locationHighlight.highlighted,
        highlightedDescription: descriptionHighlight.highlighted,
        host: {
          name: h.hostName,
          avatar: h.hostAvatar,
          isSuperhost: h.isSuperhost,
        },
      };
    });

    const payload = { 
      code: 200, 
      data: formatted,
      meta: {
        total: formatted.length,
        keyword: keyword || null,
        filters: {
          category: category || null,
          minPrice: minPrice ? parseInt(minPrice) : null,
          maxPrice: maxPrice ? parseInt(maxPrice) : null,
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          amenities: amenities || null,
          sortBy: sortBy || null,
        }
      }
    };
    
    // 只对无搜索参数的请求缓存
    if (!keyword && !minPrice && !maxPrice && !bedrooms && !amenities && !sortBy) {
      cache.set('homestays:all', payload);
    }
    
    res.json(payload);
  } catch (err) {
    console.error('Error fetching homestays:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/homestays/:id', async (req, res) => {
  try {
    // 解析用户token获取收藏状态
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // Token无效，继续作为未登录用户处理
      }
    }
    
    const homestay = await prisma.homestay.findUnique({
      where: { id: req.params.id },
      include: { stocks: true },
    });
    
    if (!homestay) {
      return res.status(404).json({ code: 404, msg: 'Not found' });
    }
    
    // 如果用户已登录，检查是否收藏
    let isFavorite = false;
    if (userId) {
      const favorite = await prisma.favorite.findFirst({
        where: { userId, houseId: homestay.id },
      });
      isFavorite = !!favorite;
    }
    
    // 获取评价统计
    const reviewStats = await prisma.review.aggregate({
      where: { houseId: homestay.id, status: 'active' },
      _avg: { rating: true },
      _count: { id: true },
    });
    
    const rating = reviewStats._avg.rating || 0;
    const reviewCount = reviewStats._count.id || 0;
    
    res.json({
      code: 200,
      data: {
        id: homestay.id,
        title: homestay.title,
        location: homestay.location,
        price: homestay.price,
        rating: Math.round(rating * 10) / 10,
        reviews: reviewCount,
        images: homestay.images,
        type: homestay.type,
        guests: homestay.guests,
        bedrooms: homestay.bedrooms,
        beds: homestay.beds,
        bathrooms: homestay.bathrooms,
        amenities: homestay.amenities,
        description: homestay.description,
        isFavorite,
        host: {
          name: homestay.hostName,
          avatar: homestay.hostAvatar,
          isSuperhost: homestay.isSuperhost,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching homestay:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.post('/api/homestays', verifyAdmin, async (req, res) => {
  try {
    const { title, location, price, images, type, guests, bedrooms, beds, bathrooms, amenities, description } = req.body;
    
    const homestay = await prisma.homestay.create({
      data: {
        title,
        location,
        price: parseInt(price),
        images: images || [],
        type: type || '城市',
        guests: parseInt(guests) || 2,
        bedrooms: parseInt(bedrooms) || 1,
        beds: parseInt(beds) || 1,
        bathrooms: parseInt(bathrooms) || 1,
        amenities: amenities || [],
        description,
        hostName: 'Admin',
        hostAvatar: '',
        isSuperhost: false,
      },
    });
    
    // invalidate cache so next GET returns fresh list
    cache.del('homestays:all');

    res.json({ code: 200, msg: 'success', data: homestay });
  } catch (err) {
    console.error('Error creating homestay:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.put('/api/homestays/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, location, price, images, type, guests, bedrooms, beds, bathrooms, amenities, description } = req.body;
    
    const homestay = await prisma.homestay.update({
      where: { id: req.params.id },
      data: {
        title,
        location,
        price: price ? parseInt(price) : undefined,
        images,
        type,
        guests: guests ? parseInt(guests) : undefined,
        bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
        beds: beds ? parseInt(beds) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
        amenities,
        description,
      },
    });
    
    cache.del('homestays:all');

    res.json({ code: 200, msg: 'success', data: homestay });
  } catch (err) {
    console.error('Error updating homestay:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.delete('/api/homestays/:id', verifyAdmin, async (req, res) => {
  try {
    await prisma.homestay.delete({
      where: { id: req.params.id },
    });
    
    cache.del('homestays:all');

    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    console.error('Error deleting homestay:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const cacheKey = 'categories:all';
    const fromCache = cache.get(cacheKey);
    if (fromCache) {
      return res.json(fromCache);
    }

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    
    const formatted = categories.map(c => ({
      id: c.id,
      label: { zh: c.labelZh, en: c.labelEn, th: c.labelTh },
      icon: c.icon,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    }));

    const payload = { code: 200, data: formatted };
    cache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Users
app.get('/api/users', verifyAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { orders: true },
    });
    
    const formatted = users.map(u => ({
      id: u.id,
      name: u.username,
      email: u.email,
      phone: u.phone,
      status: u.status,
      registerTime: u.createdAt.toISOString().split('T')[0],
      orderCount: u.orders.length,
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/users/:id', verifyAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });
    
    if (!user) {
      return res.status(404).json({ code: 404, msg: 'Not found' });
    }
    
    res.json({ code: 200, data: user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.put('/api/users/:id', verifyAdmin, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
    });
    
    res.json({ code: 200, data: user });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/users/me', async (req, res) => {
  try {
    // In production, get user ID from JWT token
    const user = await prisma.user.findFirst();
    res.json({ code: 200, data: user });
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Orders
app.get('/api/orders', verifyAdmin, async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    
    const orders = await prisma.order.findMany({
      where,
      include: { user: true, house: true },
    });
    
    const formatted = orders.map(o => ({
      id: o.orderId,
      type: o.type,
      userId: o.userId,
      userName: o.user?.username || 'Unknown',
      itemName: o.itemName,
      totalPrice: o.totalPrice,
      status: o.status,
      createdAt: o.createdAt.toISOString().split('T')[0],
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/orders/:id', verifyAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { orderId: req.params.id },
      include: { user: true, house: true },
    });
    
    if (!order) {
      return res.status(404).json({ code: 404, msg: 'Not found' });
    }
    
    res.json({
      code: 200,
      data: {
        id: order.orderId,
        type: order.type,
        userId: order.userId,
        userName: order.user?.username || 'Unknown',
        itemName: order.itemName,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt.toISOString().split('T')[0],
      },
    });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.put('/api/orders/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await prisma.order.updateMany({
      where: { orderId: req.params.id },
      data: { status },
    });
    
    res.json({ code: 200, msg: 'success', data: order });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Meal Config APIs (餐饮配置)
app.get('/api/meal-configs', async (req, res) => {
  try {
    const { mealType, isActive } = req.query;
    const where = {};
    if (mealType) where.mealType = mealType;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const configs = await prisma.mealConfig.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    
    res.json({ code: 200, data: configs });
  } catch (err) {
    console.error('Error fetching meal configs:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.post('/api/meal-configs', async (req, res) => {
  try {
    const { name, description, image, price, mealType, sortOrder } = req.body;
    
    const config = await prisma.mealConfig.create({
      data: {
        name,
        description,
        image,
        price: parseInt(price),
        mealType,
        sortOrder: sortOrder || 0,
      },
    });
    
    res.json({ code: 200, msg: 'success', data: config });
  } catch (err) {
    console.error('Error creating meal config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.put('/api/meal-configs/:id', async (req, res) => {
  try {
    const { name, description, image, price, mealType, isActive, sortOrder } = req.body;
    
    const config = await prisma.mealConfig.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        image,
        price: price ? parseInt(price) : undefined,
        mealType,
        isActive,
        sortOrder,
      },
    });
    
    res.json({ code: 200, msg: 'success', data: config });
  } catch (err) {
    console.error('Error updating meal config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.delete('/api/meal-configs/:id', async (req, res) => {
  try {
    await prisma.mealConfig.delete({
      where: { id: req.params.id },
    });
    
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    console.error('Error deleting meal config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Meal Orders (订餐订单)
app.post('/api/meals', async (req, res) => {
  try {
    const { roomNumber, mealConfigId, peopleCount, remark } = req.body;
    
    // Validate meal config exists
    const mealConfig = await prisma.mealConfig.findUnique({
      where: { id: mealConfigId },
    });
    
    if (!mealConfig) {
      return res.status(400).json({ code: 400, msg: '套餐不存在' });
    }
    
    if (!mealConfig.isActive) {
      return res.status(400).json({ code: 400, msg: '该套餐已下架' });
    }
    
    const totalPrice = mealConfig.price * parseInt(peopleCount);
    
    const mealOrder = await prisma.mealOrder.create({
      data: {
        roomNumber,
        mealConfigId,
        mealType: mealConfig.mealType,
        peopleCount: parseInt(peopleCount),
        totalPrice,
        remark: remark || '',
        status: 'CONFIRMED',
      },
    });
    
    res.json({ code: 200, msg: 'success', data: mealOrder });
  } catch (err) {
    console.error('Error creating meal order:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/meals/my', async (req, res) => {
  try {
    const mealOrders = await prisma.mealOrder.findMany({
      include: { mealConfig: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const formatted = mealOrders.map(m => ({
      id: m.id,
      roomNumber: m.roomNumber,
      mealConfig: {
        id: m.mealConfig.id,
        name: m.mealConfig.name,
        image: m.mealConfig.image,
        price: m.mealConfig.price,
      },
      mealType: m.mealType,
      peopleCount: m.peopleCount,
      totalPrice: m.totalPrice,
      remark: m.remark,
      status: m.status,
      createTime: m.createdAt.toISOString().replace('T', ' ').substring(0, 19),
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching meal orders:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/meals', async (req, res) => {
  try {
    const mealOrders = await prisma.mealOrder.findMany({
      include: { mealConfig: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const formatted = mealOrders.map(m => ({
      id: m.id,
      roomNumber: m.roomNumber,
      mealConfig: {
        id: m.mealConfig.id,
        name: m.mealConfig.name,
        image: m.mealConfig.image,
        price: m.mealConfig.price,
      },
      mealType: m.mealType,
      peopleCount: m.peopleCount,
      totalPrice: m.totalPrice,
      remark: m.remark,
      status: m.status,
      createTime: m.createdAt.toISOString().replace('T', ' ').substring(0, 19),
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching meal orders:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/meals/:id', async (req, res) => {
  try {
    const mealOrder = await prisma.mealOrder.findUnique({
      where: { id: req.params.id },
      include: { mealConfig: true },
    });
    
    if (!mealOrder) {
      return res.status(404).json({ code: 404, msg: 'Not found' });
    }
    
    res.json({
      code: 200,
      data: {
        id: mealOrder.id,
        roomNumber: mealOrder.roomNumber,
        mealConfig: mealOrder.mealConfig,
        mealType: mealOrder.mealType,
        peopleCount: mealOrder.peopleCount,
        totalPrice: mealOrder.totalPrice,
        remark: mealOrder.remark,
        status: mealOrder.status,
        createTime: mealOrder.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      },
    });
  } catch (err) {
    console.error('Error fetching meal order:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.post('/api/meals/:id/cancel', async (req, res) => {
  try {
    const mealOrder = await prisma.mealOrder.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    
    res.json({ code: 200, msg: 'success', data: mealOrder });
  } catch (err) {
    console.error('Error cancelling meal order:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.put('/api/meals/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const mealOrder = await prisma.mealOrder.update({
      where: { id: req.params.id },
      data: { status },
    });
    
    res.json({ code: 200, msg: 'success', data: mealOrder });
  } catch (err) {
    console.error('Error updating meal order status:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Ticket Config APIs (票务配置)
app.get('/api/ticket-configs', async (req, res) => {
  try {
    const { ticketType, isActive } = req.query;
    const where = {};
    if (ticketType) where.ticketType = ticketType;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const configs = await prisma.ticketConfig.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    
    res.json({ code: 200, data: configs });
  } catch (err) {
    console.error('Error fetching ticket configs:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.post('/api/ticket-configs', async (req, res) => {
  try {
    const { name, description, image, price, ticketType, sortOrder } = req.body;
    
    const config = await prisma.ticketConfig.create({
      data: {
        name,
        description,
        image,
        price: parseInt(price),
        ticketType,
        sortOrder: sortOrder || 0,
      },
    });
    
    res.json({ code: 200, msg: 'success', data: config });
  } catch (err) {
    console.error('Error creating ticket config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.put('/api/ticket-configs/:id', async (req, res) => {
  try {
    const { name, description, image, price, ticketType, isActive, sortOrder } = req.body;
    
    const config = await prisma.ticketConfig.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        image,
        price: price ? parseInt(price) : undefined,
        ticketType,
        isActive,
        sortOrder,
      },
    });
    
    res.json({ code: 200, msg: 'success', data: config });
  } catch (err) {
    console.error('Error updating ticket config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.delete('/api/ticket-configs/:id', async (req, res) => {
  try {
    await prisma.ticketConfig.delete({
      where: { id: req.params.id },
    });
    
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    console.error('Error deleting ticket config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Ticket Orders (票务订单)
app.post('/api/tickets', async (req, res) => {
  try {
    const { roomNumber, ticketConfigId, quantity, visitDate, remark } = req.body;
    
    const ticketConfig = await prisma.ticketConfig.findUnique({
      where: { id: ticketConfigId },
    });
    
    if (!ticketConfig) {
      return res.status(400).json({ code: 400, msg: '票务不存在' });
    }
    
    if (!ticketConfig.isActive) {
      return res.status(400).json({ code: 400, msg: '该票务已下架' });
    }
    
    const totalPrice = ticketConfig.price * parseInt(quantity);
    
    const ticketOrder = await prisma.ticketOrder.create({
      data: {
        roomNumber,
        ticketConfigId,
        quantity: parseInt(quantity),
        totalPrice,
        visitDate: visitDate ? new Date(visitDate) : null,
        remark: remark || '',
        status: 'CONFIRMED',
      },
    });
    
    res.json({ code: 200, msg: 'success', data: ticketOrder });
  } catch (err) {
    console.error('Error creating ticket order:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/tickets/my', async (req, res) => {
  try {
    const ticketOrders = await prisma.ticketOrder.findMany({
      include: { ticketConfig: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const formatted = ticketOrders.map(t => ({
      id: t.id,
      roomNumber: t.roomNumber,
      ticketConfig: {
        id: t.ticketConfig.id,
        name: t.ticketConfig.name,
        image: t.ticketConfig.image,
        price: t.ticketConfig.price,
      },
      quantity: t.quantity,
      totalPrice: t.totalPrice,
      visitDate: t.visitDate ? t.visitDate.toISOString().split('T')[0] : null,
      remark: t.remark,
      status: t.status,
      createTime: t.createdAt.toISOString().replace('T', ' ').substring(0, 19),
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching ticket orders:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/tickets', async (req, res) => {
  try {
    const ticketOrders = await prisma.ticketOrder.findMany({
      include: { ticketConfig: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const formatted = ticketOrders.map(t => ({
      id: t.id,
      roomNumber: t.roomNumber,
      ticketConfig: {
        id: t.ticketConfig.id,
        name: t.ticketConfig.name,
        image: t.ticketConfig.image,
        price: t.ticketConfig.price,
      },
      quantity: t.quantity,
      totalPrice: t.totalPrice,
      visitDate: t.visitDate ? t.visitDate.toISOString().split('T')[0] : null,
      remark: t.remark,
      status: t.status,
      createTime: t.createdAt.toISOString().replace('T', ' ').substring(0, 19),
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching ticket orders:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticketOrder = await prisma.ticketOrder.findUnique({
      where: { id: req.params.id },
      include: { ticketConfig: true },
    });
    
    if (!ticketOrder) {
      return res.status(404).json({ code: 404, msg: 'Not found' });
    }
    
    res.json({
      code: 200,
      data: {
        id: ticketOrder.id,
        roomNumber: ticketOrder.roomNumber,
        ticketConfig: ticketOrder.ticketConfig,
        quantity: ticketOrder.quantity,
        totalPrice: ticketOrder.totalPrice,
        visitDate: ticketOrder.visitDate ? ticketOrder.visitDate.toISOString().split('T')[0] : null,
        remark: ticketOrder.remark,
        status: ticketOrder.status,
        createTime: ticketOrder.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      },
    });
  } catch (err) {
    console.error('Error fetching ticket order:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.post('/api/tickets/:id/cancel', async (req, res) => {
  try {
    const ticketOrder = await prisma.ticketOrder.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    
    res.json({ code: 200, msg: 'success', data: ticketOrder });
  } catch (err) {
    console.error('Error cancelling ticket order:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.put('/api/tickets/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const ticketOrder = await prisma.ticketOrder.update({
      where: { id: req.params.id },
      data: { status },
    });
    
    res.json({ code: 200, msg: 'success', data: ticketOrder });
  } catch (err) {
    console.error('Error updating ticket order status:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Car Config APIs (车辆配置)
app.get('/api/car-configs', async (req, res) => {
  try {
    const { carType, isActive } = req.query;
    const where = {};
    if (carType) where.carType = carType;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const configs = await prisma.carConfig.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    
    res.json({ code: 200, data: configs });
  } catch (err) {
    console.error('Error fetching car configs:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.post('/api/car-configs', async (req, res) => {
  try {
    const { name, description, image, price, carType, seats, sortOrder } = req.body;
    
    const config = await prisma.carConfig.create({
      data: {
        name,
        description,
        image,
        price: parseInt(price),
        carType,
        seats: parseInt(seats) || 5,
        sortOrder: sortOrder || 0,
      },
    });
    
    res.json({ code: 200, msg: 'success', data: config });
  } catch (err) {
    console.error('Error creating car config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.put('/api/car-configs/:id', async (req, res) => {
  try {
    const { name, description, image, price, carType, seats, isActive, sortOrder } = req.body;
    
    const config = await prisma.carConfig.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        image,
        price: price ? parseInt(price) : undefined,
        carType,
        seats: seats ? parseInt(seats) : undefined,
        isActive,
        sortOrder,
      },
    });
    
    res.json({ code: 200, msg: 'success', data: config });
  } catch (err) {
    console.error('Error updating car config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.delete('/api/car-configs/:id', async (req, res) => {
  try {
    await prisma.carConfig.delete({
      where: { id: req.params.id },
    });
    
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    console.error('Error deleting car config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Car Rentals (租车订单)
app.post('/api/car-rentals', async (req, res) => {
  try {
    const { roomNumber, carConfigId, startTime, endTime, days, remark } = req.body;
    
    // Validate car config exists
    const carConfig = await prisma.carConfig.findUnique({
      where: { id: carConfigId },
    });
    
    if (!carConfig) {
      return res.status(400).json({ code: 400, msg: '车辆不存在' });
    }
    
    if (!carConfig.isActive) {
      return res.status(400).json({ code: 400, msg: '该车辆已下架' });
    }
    
    const totalPrice = carConfig.price * parseInt(days);
    
    const carRental = await prisma.carRental.create({
      data: {
        roomNumber,
        carConfigId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        days: parseInt(days),
        totalPrice,
        remark: remark || '',
        status: 'PENDING',
      },
    });
    
    res.json({ code: 200, msg: 'success', data: carRental });
  } catch (err) {
    console.error('Error creating car rental:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/car-rentals/my', async (req, res) => {
  try {
    const carRentals = await prisma.carRental.findMany({
      include: { carConfig: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const formatted = carRentals.map(c => ({
      id: c.id,
      roomNumber: c.roomNumber,
      carConfig: {
        id: c.carConfig.id,
        name: c.carConfig.name,
        image: c.carConfig.image,
        price: c.carConfig.price,
        carType: c.carConfig.carType,
      },
      startTime: c.startTime.toISOString(),
      endTime: c.endTime.toISOString(),
      days: c.days,
      totalPrice: c.totalPrice,
      remark: c.remark,
      status: c.status,
      createTime: c.createdAt.toISOString().replace('T', ' ').substring(0, 19),
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching car rentals:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/car-rentals', async (req, res) => {
  try {
    const carRentals = await prisma.carRental.findMany({
      include: { carConfig: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const formatted = carRentals.map(c => ({
      id: c.id,
      roomNumber: c.roomNumber,
      carConfig: {
        id: c.carConfig.id,
        name: c.carConfig.name,
        image: c.carConfig.image,
        price: c.carConfig.price,
        carType: c.carConfig.carType,
      },
      startTime: c.startTime.toISOString(),
      endTime: c.endTime.toISOString(),
      days: c.days,
      totalPrice: c.totalPrice,
      remark: c.remark,
      status: c.status,
      createTime: c.createdAt.toISOString().replace('T', ' ').substring(0, 19),
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching car rentals:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/car-rentals/:id', async (req, res) => {
  try {
    const carRental = await prisma.carRental.findUnique({
      where: { id: req.params.id },
      include: { carConfig: true },
    });
    
    if (!carRental) {
      return res.status(404).json({ code: 404, msg: 'Not found' });
    }
    
    res.json({
      code: 200,
      data: {
        id: carRental.id,
        roomNumber: carRental.roomNumber,
        carConfig: carRental.carConfig,
        startTime: carRental.startTime.toISOString(),
        endTime: carRental.endTime.toISOString(),
        days: carRental.days,
        totalPrice: carRental.totalPrice,
        remark: carRental.remark,
        status: carRental.status,
        createTime: carRental.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      },
    });
  } catch (err) {
    console.error('Error fetching car rental:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.post('/api/car-rentals/:id/cancel', async (req, res) => {
  try {
    const carRental = await prisma.carRental.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    
    res.json({ code: 200, msg: 'success', data: carRental });
  } catch (err) {
    console.error('Error cancelling car rental:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.put('/api/car-rentals/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const carRental = await prisma.carRental.update({
      where: { id: req.params.id },
      data: { status },
    });
    
    res.json({ code: 200, msg: 'success', data: carRental });
  } catch (err) {
    console.error('Error updating car rental status:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// Car Stock APIs (车辆库存管理)
// ============================================

// GET /api/car-configs/:id/stock - 获取车辆库存信息
app.get('/api/car-configs/:id/stock', async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;
    
    let queryStartDate, queryEndDate;
    
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      queryStartDate = new Date(year, mon - 1, 1);
      queryEndDate = new Date(year, mon, 0);
    } else if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      return res.status(400).json({ code: 400, msg: '请提供 month 或 startDate/endDate 参数' });
    }
    
    const stocks = await prisma.carStock.findMany({
      where: {
        carConfigId: req.params.id,
        date: {
          gte: queryStartDate,
          lte: queryEndDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    
    const data = {};
    for (const s of stocks) {
      const dateStr = s.date.toISOString().split('T')[0];
      data[dateStr] = {
        total: s.totalStock,
        booked: s.bookedStock,
        available: s.totalStock - s.bookedStock,
        price: s.price,
      };
    }
    
    res.json({ code: 200, data });
  } catch (err) {
    console.error('Error fetching car stock:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/car-configs/:id/init-stock - 初始化车辆库存（管理员）
app.post('/api/car-configs/:id/init-stock', verifyAdmin, async (req, res) => {
  try {
    const { totalStock, startDate, endDate, price } = req.body;
    
    if (!totalStock || totalStock < 1) {
      return res.status(400).json({ code: 400, msg: '库存数量必须大于0' });
    }
    
    let queryStartDate, queryEndDate;
    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      queryStartDate = new Date();
      queryStartDate.setHours(0, 0, 0, 0);
      queryEndDate = new Date(queryStartDate);
      queryEndDate.setDate(queryEndDate.getDate() + 90);
    }
    
    const stocks = [];
    const current = new Date(queryStartDate);
    while (current <= queryEndDate) {
      stocks.push({
        carConfigId: req.params.id,
        date: new Date(current),
        totalStock,
        bookedStock: 0,
        price: price || null,
      });
      current.setDate(current.getDate() + 1);
    }
    
    let count = 0;
    for (const stock of stocks) {
      await prisma.carStock.upsert({
        where: { carConfigId_date: { carConfigId: stock.carConfigId, date: stock.date } },
        update: { totalStock: stock.totalStock, price: stock.price },
        create: stock,
      });
      count++;
    }
    
    res.json({ 
      code: 200, 
      msg: `成功初始化 ${count} 天的库存`,
      data: { count }
    });
  } catch (err) {
    console.error('Error initializing car stock:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/car-configs/:id/stock/:date - 调整单日库存（管理员）
app.put('/api/car-configs/:id/stock/:date', verifyAdmin, async (req, res) => {
  try {
    const { totalStock, price } = req.body;
    const date = new Date(req.params.date);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ code: 400, msg: '无效的日期格式' });
    }
    
    let stock = await prisma.carStock.findUnique({
      where: { carConfigId_date: { carConfigId: req.params.id, date } },
    });
    
    if (stock) {
      const updateData = {};
      if (totalStock !== undefined) {
        if (totalStock < stock.bookedStock) {
          return res.status(400).json({ 
            code: 400, 
            msg: `总库存不能小于已预订数量 (${stock.bookedStock})` 
          });
        }
        updateData.totalStock = totalStock;
      }
      if (price !== undefined) {
        updateData.price = price;
      }
      
      stock = await prisma.carStock.update({
        where: { carConfigId_date: { carConfigId: req.params.id, date } },
        data: updateData,
      });
    } else {
      stock = await prisma.carStock.create({
        data: {
          carConfigId: req.params.id,
          date,
          totalStock: totalStock || 1,
          bookedStock: 0,
          price: price || null,
        },
      });
    }
    
    res.json({
      code: 200,
      msg: '库存更新成功',
      data: {
        date: stock.date.toISOString().split('T')[0],
        total: stock.totalStock,
        booked: stock.bookedStock,
        available: stock.totalStock - stock.bookedStock,
        price: stock.price,
      },
    });
  } catch (err) {
    console.error('Error updating car stock:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/car-configs/:id/batch-stock - 批量设置库存（管理员）
app.post('/api/car-configs/:id/batch-stock', verifyAdmin, async (req, res) => {
  try {
    const { dates, totalStock, price } = req.body;
    
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ code: 400, msg: '请提供日期数组' });
    }
    
    if (!totalStock || totalStock < 1) {
      return res.status(400).json({ code: 400, msg: '库存数量必须大于0' });
    }
    
    let count = 0;
    for (const dateStr of dates) {
      const date = new Date(dateStr);
      
      await prisma.carStock.upsert({
        where: { carConfigId_date: { carConfigId: req.params.id, date } },
        update: { 
          totalStock,
          ...(price !== undefined && { price }),
        },
        create: {
          carConfigId: req.params.id,
          date,
          totalStock,
          bookedStock: 0,
          price: price || null,
        },
      });
      count++;
    }
    
    res.json({
      code: 200,
      msg: `成功设置 ${count} 天的库存`,
      data: { count },
    });
  } catch (err) {
    console.error('Error batch updating car stock:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/car-configs/:id/unavailable-dates - 获取不可用日期
app.get('/api/car-configs/:id/unavailable-dates', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const queryStartDate = startDate ? new Date(startDate) : new Date();
    queryStartDate.setHours(0, 0, 0, 0);
    
    const queryEndDate = endDate ? new Date(endDate) : new Date(queryStartDate);
    if (!endDate) {
      queryEndDate.setDate(queryEndDate.getDate() + 90);
    }
    
    const stocks = await prisma.carStock.findMany({
      where: {
        carConfigId: req.params.id,
        date: {
          gte: queryStartDate,
          lte: queryEndDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    
    const unavailableDates = [];
    for (const stock of stocks) {
      const available = stock.totalStock - stock.bookedStock;
      if (available <= 0) {
        unavailableDates.push(stock.date.toISOString().split('T')[0]);
      }
    }
    
    res.json({ code: 200, data: unavailableDates });
  } catch (err) {
    console.error('Error fetching unavailable dates:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/car-configs/:id/stock/cleanup - 清理过期库存（管理员）
app.delete('/api/car-configs/:id/stock/cleanup', verifyAdmin, async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 1);
    
    const result = await prisma.carStock.deleteMany({
      where: {
        carConfigId: req.params.id,
        date: { lt: cutoff },
      },
    });
    
    res.json({
      code: 200,
      msg: `已清理 ${result.count} 条过期库存`,
      data: { count: result.count },
    });
  } catch (err) {
    console.error('Error cleaning up car stock:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// Driver APIs (司机管理)
// ============================================

// GET /api/drivers - 获取所有司机（管理员）
app.get('/api/drivers', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    
    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    const formatted = drivers.map(d => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      avatar: d.avatar,
      licenseNumber: d.licenseNumber,
      status: d.status,
      dailyFee: d.dailyFee,
      remark: d.remark,
      createdAt: d.createdAt.toISOString(),
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching drivers:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/drivers/:id - 获取单个司机（管理员）
app.get('/api/drivers/:id', verifyAdmin, async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
    });
    
    if (!driver) {
      return res.status(404).json({ code: 404, msg: '司机不存在' });
    }
    
    res.json({
      code: 200,
      data: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        avatar: driver.avatar,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
        dailyFee: driver.dailyFee,
        remark: driver.remark,
        createdAt: driver.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error fetching driver:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/drivers - 创建司机（管理员）
app.post('/api/drivers', verifyAdmin, async (req, res) => {
  try {
    const { name, phone, avatar, licenseNumber, status, dailyFee, remark } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ code: 400, msg: '姓名和电话为必填项' });
    }
    
    const driver = await prisma.driver.create({
      data: {
        name,
        phone,
        avatar: avatar || null,
        licenseNumber: licenseNumber || null,
        status: status || 'active',
        dailyFee: dailyFee || 0,
        remark: remark || null,
      },
    });
    
    res.json({ code: 200, msg: '创建成功', data: driver });
  } catch (err) {
    console.error('Error creating driver:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/drivers/:id - 更新司机（管理员）
app.put('/api/drivers/:id', verifyAdmin, async (req, res) => {
  try {
    const { name, phone, avatar, licenseNumber, status, dailyFee, remark } = req.body;
    
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: {
        name,
        phone,
        avatar,
        licenseNumber,
        status,
        dailyFee: dailyFee !== undefined ? dailyFee : undefined,
        remark,
      },
    });
    
    res.json({ code: 200, msg: '更新成功', data: driver });
  } catch (err) {
    console.error('Error updating driver:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/drivers/:id - 删除司机（管理员）
app.delete('/api/drivers/:id', verifyAdmin, async (req, res) => {
  try {
    await prisma.driver.delete({
      where: { id: req.params.id },
    });
    
    res.json({ code: 200, msg: '删除成功' });
  } catch (err) {
    console.error('Error deleting driver:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// Driver Schedule APIs (司机排班)
// ============================================

// GET /api/drivers/:id/schedule - 获取司机排班（管理员）
app.get('/api/drivers/:id/schedule', verifyAdmin, async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;
    
    let queryStartDate, queryEndDate;
    
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      queryStartDate = new Date(year, mon - 1, 1);
      queryEndDate = new Date(year, mon, 0);
    } else if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      queryStartDate = new Date();
      queryStartDate.setHours(0, 0, 0, 0);
      queryEndDate = new Date(queryStartDate);
      queryEndDate.setDate(queryEndDate.getDate() + 30);
    }
    
    const schedules = await prisma.driverSchedule.findMany({
      where: {
        driverId: req.params.id,
        date: {
          gte: queryStartDate,
          lte: queryEndDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    
    const data = {};
    for (const s of schedules) {
      const dateStr = s.date.toISOString().split('T')[0];
      data[dateStr] = {
        status: s.status,
        remark: s.remark,
      };
    }
    
    res.json({ code: 200, data });
  } catch (err) {
    console.error('Error fetching driver schedule:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/drivers/:id/schedule - 设置司机排班（管理员）
app.post('/api/drivers/:id/schedule', verifyAdmin, async (req, res) => {
  try {
    const { dates, status, remark } = req.body;
    
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ code: 400, msg: '请提供日期数组' });
    }
    
    if (!status) {
      return res.status(400).json({ code: 400, msg: '请提供状态' });
    }
    
    let count = 0;
    for (const dateStr of dates) {
      const date = new Date(dateStr);
      
      await prisma.driverSchedule.upsert({
        where: { driverId_date: { driverId: req.params.id, date } },
        update: { 
          status,
          remark: remark || null,
        },
        create: {
          driverId: req.params.id,
          date,
          status,
          remark: remark || null,
        },
      });
      count++;
    }
    
    res.json({
      code: 200,
      msg: `成功设置 ${count} 天的排班`,
      data: { count },
    });
  } catch (err) {
    console.error('Error setting driver schedule:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/driver-schedules/available - 获取某日期可用司机
app.get('/api/driver-schedules/available', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ code: 400, msg: '请提供日期' });
    }
    
    const queryDate = new Date(date);
    
    // 获取所有活跃司机
    const activeDrivers = await prisma.driver.findMany({
      where: { status: 'active' },
    });
    
    // 获取当天已排班的司机
    const bookedSchedules = await prisma.driverSchedule.findMany({
      where: {
        date: queryDate,
        status: 'booked',
      },
    });
    
    const bookedDriverIds = new Set(bookedSchedules.map(s => s.driverId));
    
    // 获取当天设置为休息的司机
    const offSchedules = await prisma.driverSchedule.findMany({
      where: {
        date: queryDate,
        status: 'off',
      },
    });
    
    const offDriverIds = new Set(offSchedules.map(s => s.driverId));
    
    // 过滤出可用司机
    const availableDrivers = activeDrivers.filter(d => 
      !bookedDriverIds.has(d.id) && !offDriverIds.has(d.id)
    );
    
    const formatted = availableDrivers.map(d => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      avatar: d.avatar,
      dailyFee: d.dailyFee,
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching available drivers:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/driver-schedules/calendar - 获取司机排班日历（管理员）
app.get('/api/driver-schedules/calendar', verifyAdmin, async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;
    
    let queryStartDate, queryEndDate;
    
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      queryStartDate = new Date(year, mon - 1, 1);
      queryEndDate = new Date(year, mon, 0);
    } else if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      queryStartDate = new Date();
      queryStartDate.setHours(0, 0, 0, 0);
      queryEndDate = new Date(queryStartDate);
      queryEndDate.setDate(queryEndDate.getDate() + 30);
    }
    
    // 获取所有活跃司机
    const drivers = await prisma.driver.findMany({
      where: { status: 'active' },
    });
    
    // 获取日期范围内的所有排班
    const schedules = await prisma.driverSchedule.findMany({
      where: {
        date: {
          gte: queryStartDate,
          lte: queryEndDate,
        },
      },
      include: {
        driver: true,
      },
    });
    
    // 按日期组织数据
    const calendar = {};
    for (const schedule of schedules) {
      const dateStr = schedule.date.toISOString().split('T')[0];
      if (!calendar[dateStr]) {
        calendar[dateStr] = {
          available: [],
          booked: [],
          off: [],
        };
      }
      
      const driverInfo = {
        id: schedule.driver.id,
        name: schedule.driver.name,
        phone: schedule.driver.phone,
      };
      
      if (schedule.status === 'available') {
        calendar[dateStr].available.push(driverInfo);
      } else if (schedule.status === 'booked') {
        calendar[dateStr].booked.push(driverInfo);
      } else if (schedule.status === 'off') {
        calendar[dateStr].off.push(driverInfo);
      }
    }
    
    // 添加没有排班记录的活跃司机到 available
    for (const driver of drivers) {
      const today = new Date(queryStartDate);
      while (today <= queryEndDate) {
        const dateStr = today.toISOString().split('T')[0];
        if (!calendar[dateStr]) {
          calendar[dateStr] = {
            available: [],
            booked: [],
            off: [],
          };
        }
        
        // 检查该司机当天是否已有排班记录
        const hasRecord = schedules.some(
          s => s.driverId === driver.id && s.date.toISOString().split('T')[0] === dateStr
        );
        
        if (!hasRecord) {
          calendar[dateStr].available.push({
            id: driver.id,
            name: driver.name,
            phone: driver.phone,
          });
        }
        
        today.setDate(today.getDate() + 1);
      }
    }
    
    res.json({ code: 200, data: calendar });
  } catch (err) {
    console.error('Error fetching driver calendar:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// =====================================================
// 员工管理 API (Staff Management)
// =====================================================

// GET /api/staffs - 获取员工列表（管理员）
app.get('/api/staffs', verifyAdmin, async (req, res) => {
  try {
    const { staffType, status, search } = req.query;
    
    const where = {};
    
    if (staffType) {
      where.staffType = staffType;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    
    const staffs = await prisma.staff.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { schedules: true },
        },
      },
    });
    
    const formatted = staffs.map(s => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      avatar: s.avatar,
      staffType: s.staffType,
      status: s.status,
      dailyWage: s.dailyWage,
      idNumber: s.idNumber,
      emergencyContact: s.emergencyContact,
      emergencyPhone: s.emergencyPhone,
      hireDate: s.hireDate,
      remark: s.remark,
      scheduleCount: s._count.schedules,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching staffs:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/staffs/types - 获取员工类型列表（必须在 :id 路由之前）
app.get('/api/staffs/types', (req, res) => {
  res.json({
    code: 200,
    data: [
      { value: 'cleaner', label: '清洁工', labelEn: 'Cleaner' },
      { value: 'receptionist', label: '前台', labelEn: 'Receptionist' },
      { value: 'admin', label: '管理员', labelEn: 'Administrator' },
      { value: 'maintenance', label: '维护人员', labelEn: 'Maintenance' },
      { value: 'other', label: '其他', labelEn: 'Other' },
    ],
  });
});

// GET /api/staffs/:id - 获取员工详情（管理员）
app.get('/api/staffs/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        schedules: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });
    
    if (!staff) {
      return res.status(404).json({ code: 404, msg: '员工不存在' });
    }
    
    res.json({
      code: 200,
      data: {
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        avatar: staff.avatar,
        staffType: staff.staffType,
        status: staff.status,
        dailyWage: staff.dailyWage,
        idNumber: staff.idNumber,
        emergencyContact: staff.emergencyContact,
        emergencyPhone: staff.emergencyPhone,
        hireDate: staff.hireDate,
        remark: staff.remark,
        schedules: staff.schedules.map(s => ({
          id: s.id,
          date: s.date,
          status: s.status,
          workHours: s.workHours,
          remark: s.remark,
        })),
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      },
    });
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/staffs - 创建员工（管理员）
app.post('/api/staffs', verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      phone,
      avatar,
      staffType,
      dailyWage,
      idNumber,
      emergencyContact,
      emergencyPhone,
      hireDate,
      remark,
    } = req.body;
    
    if (!name || !phone || !staffType) {
      return res.status(400).json({ code: 400, msg: '姓名、电话和员工类型为必填项' });
    }
    
    const validTypes = ['cleaner', 'receptionist', 'admin', 'maintenance', 'other'];
    if (!validTypes.includes(staffType)) {
      return res.status(400).json({ code: 400, msg: '无效的员工类型' });
    }
    
    const staff = await prisma.staff.create({
      data: {
        name,
        phone,
        avatar: avatar || null,
        staffType,
        status: 'active',
        dailyWage: dailyWage || 0,
        idNumber: idNumber || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        hireDate: hireDate ? new Date(hireDate) : null,
        remark: remark || null,
      },
    });
    
    res.json({ code: 200, msg: '创建成功', data: staff });
  } catch (err) {
    console.error('Error creating staff:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/staffs/:id - 更新员工（管理员）
app.put('/api/staffs/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      avatar,
      staffType,
      status,
      dailyWage,
      idNumber,
      emergencyContact,
      emergencyPhone,
      hireDate,
      remark,
    } = req.body;
    
    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ code: 404, msg: '员工不存在' });
    }
    
    const staff = await prisma.staff.update({
      where: { id },
      data: {
        name: name || existing.name,
        phone: phone || existing.phone,
        avatar: avatar !== undefined ? avatar : existing.avatar,
        staffType: staffType || existing.staffType,
        status: status || existing.status,
        dailyWage: dailyWage !== undefined ? dailyWage : existing.dailyWage,
        idNumber: idNumber !== undefined ? idNumber : existing.idNumber,
        emergencyContact: emergencyContact !== undefined ? emergencyContact : existing.emergencyContact,
        emergencyPhone: emergencyPhone !== undefined ? emergencyPhone : existing.emergencyPhone,
        hireDate: hireDate !== undefined ? (hireDate ? new Date(hireDate) : null) : existing.hireDate,
        remark: remark !== undefined ? remark : existing.remark,
      },
    });
    
    res.json({ code: 200, msg: '更新成功', data: staff });
  } catch (err) {
    console.error('Error updating staff:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/staffs/:id - 删除员工（管理员）
app.delete('/api/staffs/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ code: 404, msg: '员工不存在' });
    }
    
    await prisma.staff.delete({ where: { id } });
    
    res.json({ code: 200, msg: '删除成功' });
  } catch (err) {
    console.error('Error deleting staff:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/staffs/:id/schedule - 获取员工排班（管理员）
app.get('/api/staffs/:id/schedule', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) {
      return res.status(404).json({ code: 404, msg: '员工不存在' });
    }
    
    let queryStartDate, queryEndDate;
    
    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      queryStartDate = new Date();
      queryStartDate.setHours(0, 0, 0, 0);
      queryEndDate = new Date(queryStartDate);
      queryEndDate.setDate(queryEndDate.getDate() + 30);
    }
    
    const schedules = await prisma.staffSchedule.findMany({
      where: {
        staffId: id,
        date: {
          gte: queryStartDate,
          lte: queryEndDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    
    const formatted = schedules.map(s => ({
      id: s.id,
      date: s.date,
      status: s.status,
      workHours: s.workHours,
      remark: s.remark,
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching staff schedule:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/staffs/:id/schedule - 批量设置员工排班（管理员）
app.post('/api/staffs/:id/schedule', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { schedules } = req.body; // [{ date, status, workHours, remark }]
    
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) {
      return res.status(404).json({ code: 404, msg: '员工不存在' });
    }
    
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ code: 400, msg: '请提供排班数据' });
    }
    
    const validStatuses = ['scheduled', 'working', 'completed', 'absent', 'off'];
    
    let count = 0;
    for (const item of schedules) {
      if (!item.date || !item.status) continue;
      if (!validStatuses.includes(item.status)) continue;
      
      const scheduleDate = new Date(item.date);
      
      await prisma.staffSchedule.upsert({
        where: {
          staffId_date: {
            staffId: id,
            date: scheduleDate,
          },
        },
        update: {
          status: item.status,
          workHours: item.workHours || null,
          remark: item.remark || null,
        },
        create: {
          staffId: id,
          date: scheduleDate,
          status: item.status,
          workHours: item.workHours || null,
          remark: item.remark || null,
        },
      });
      count++;
    }
    
    res.json({
      code: 200,
      msg: `成功设置 ${count} 天的排班`,
      data: { count },
    });
  } catch (err) {
    console.error('Error setting staff schedule:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/staff-schedules/calendar - 获取员工排班日历（管理员）
app.get('/api/staff-schedules/calendar', verifyAdmin, async (req, res) => {
  try {
    const { startDate, endDate, month, staffType } = req.query;
    
    let queryStartDate, queryEndDate;
    
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      queryStartDate = new Date(year, mon - 1, 1);
      queryEndDate = new Date(year, mon, 0);
    } else if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      queryStartDate = new Date();
      queryStartDate.setHours(0, 0, 0, 0);
      queryEndDate = new Date(queryStartDate);
      queryEndDate.setDate(queryEndDate.getDate() + 30);
    }
    
    // 获取所有活跃员工
    const staffWhere = { status: 'active' };
    if (staffType) {
      staffWhere.staffType = staffType;
    }
    
    const staffs = await prisma.staff.findMany({
      where: staffWhere,
    });
    
    // 获取日期范围内的所有排班
    const schedules = await prisma.staffSchedule.findMany({
      where: {
        date: {
          gte: queryStartDate,
          lte: queryEndDate,
        },
      },
      include: {
        staff: true,
      },
    });
    
    // 按日期组织数据
    const calendar = {};
    for (const schedule of schedules) {
      const dateStr = schedule.date.toISOString().split('T')[0];
      if (!calendar[dateStr]) {
        calendar[dateStr] = {
          scheduled: [],
          working: [],
          completed: [],
          absent: [],
          off: [],
        };
      }
      
      const staffInfo = {
        id: schedule.staff.id,
        name: schedule.staff.name,
        phone: schedule.staff.phone,
        staffType: schedule.staff.staffType,
        workHours: schedule.workHours,
      };
      
      if (calendar[dateStr][schedule.status]) {
        calendar[dateStr][schedule.status].push(staffInfo);
      }
    }
    
    res.json({ code: 200, data: calendar });
  } catch (err) {
    console.error('Error fetching staff calendar:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Finance
app.get('/api/finance/overview', verifyAdmin, async (req, res) => {
  try {
    const totalOrders = await prisma.order.count();
    const totalRevenue = await prisma.order.aggregate({
      _sum: { totalPrice: true },
    });
    
    res.json({
      code: 200,
      data: {
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        totalOrders,
        pendingWithdrawals: 0,
        monthlyGrowth: 12.5,
      },
    });
  } catch (err) {
    console.error('Error fetching finance overview:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/finance/transactions', verifyAdmin, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    const formatted = transactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      createdAt: t.createdAt.toISOString().split('T')[0],
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Auth - User Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({ code: 400, msg: '邮箱和密码为必填项' });
    }

    if (password.length < 6) {
      return res.status(400).json({ code: 400, msg: '密码长度不能少于6位' });
    }

    // 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ code: 400, msg: '该邮箱已被注册' });
    }

    // 检查用户名是否已被使用（如果提供了用户名）
    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({ code: 400, msg: '该用户名已被使用' });
      }
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username: username || email.split('@')[0], // 默认使用邮箱前缀作为用户名
        email,
        password: hashedPassword,
        phone: phone || null,
        role: 'USER',
        status: 'active',
      },
    });

    // 生成JWT Token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      code: 200,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Auth - User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ code: 400, msg: '请输入邮箱和密码' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ code: 401, msg: '用户不存在' });
    }
    
    const isValid = await checkPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ code: 401, msg: '密码错误' });
    }
    
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      code: 200,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Auth - User Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    // JWT是无状态的，服务端不需要维护会话
    // 客户端只需要删除本地存储的token即可
    res.json({
      code: 200,
      msg: '登出成功',
    });
  } catch (err) {
    console.error('Error logging out:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Auth - Get Current User Info
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        isHost: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }

    res.json({
      code: 200,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        isHost: user.isHost,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// User - Update Profile
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const { username, phone, avatar } = req.body;
    const userId = req.user.id;

    // 检查用户名是否已被使用
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId },
        },
      });
      if (existingUser) {
        return res.status(400).json({ code: 400, msg: '该用户名已被使用' });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        isHost: true,
        createdAt: true,
      },
    });

    res.json({
      code: 200,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        isHost: user.isHost,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// User - Change Password
app.put('/api/user/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ code: 400, msg: '请提供当前密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ code: 400, msg: '新密码长度不能少于6位' });
    }

    // 获取用户
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }

    // 验证当前密码
    const isValid = await checkPassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ code: 400, msg: '当前密码错误' });
    }

    // 更新密码
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ code: 200, msg: '密码修改成功' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// Favorites APIs (收藏)
// ============================================

// GET /api/favorites - 获取用户收藏列表
app.get('/api/favorites', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        house: {
          select: {
            id: true,
            title: true,
            location: true,
            price: true,
            rating: true,
            reviews: true,
            images: true,
            type: true,
            guests: true,
            bedrooms: true,
            beds: true,
            bathrooms: true,
            hostName: true,
            hostAvatar: true,
            isSuperhost: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = favorites.map(f => ({
      id: f.id,
      createdAt: f.createdAt.toISOString(),
      homestay: {
        ...f.house,
        host: {
          name: f.house.hostName,
          avatar: f.house.hostAvatar,
          isSuperhost: f.house.isSuperhost,
        },
        isFavorite: true,
      },
    }));

    res.json({ code: 200, data });
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/favorites - 添加收藏
app.post('/api/favorites', authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.body;
    const userId = req.user.id;

    if (!houseId) {
      return res.status(400).json({ code: 400, msg: '请提供民宿ID' });
    }

    // 检查民宿是否存在
    const house = await prisma.homestay.findUnique({ where: { id: houseId } });
    if (!house) {
      return res.status(404).json({ code: 404, msg: '民宿不存在' });
    }

    // 检查是否已收藏
    const existing = await prisma.favorite.findUnique({
      where: { userId_houseId: { userId, houseId } },
    });

    if (existing) {
      return res.status(400).json({ code: 400, msg: '已收藏该民宿' });
    }

    const favorite = await prisma.favorite.create({
      data: { userId, houseId },
    });

    res.json({
      code: 200,
      data: {
        id: favorite.id,
        houseId,
        createdAt: favorite.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/favorites/:houseId - 取消收藏
app.delete('/api/favorites/:houseId', authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.params;
    const userId = req.user.id;

    const favorite = await prisma.favorite.findUnique({
      where: { userId_houseId: { userId, houseId } },
    });

    if (!favorite) {
      return res.status(404).json({ code: 404, msg: '未收藏该民宿' });
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    res.json({ code: 200, msg: '取消收藏成功' });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/favorites/toggle - 切换收藏状态
app.post('/api/favorites/toggle', authMiddleware, async (req, res) => {
  try {
    const { houseId } = req.body;
    const userId = req.user.id;

    if (!houseId) {
      return res.status(400).json({ code: 400, msg: '请提供民宿ID' });
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_houseId: { userId, houseId } },
    });

    if (existing) {
      // 已收藏，取消收藏
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      res.json({ code: 200, data: { isFavorite: false, action: 'removed' } });
    } else {
      // 未收藏，添加收藏
      const favorite = await prisma.favorite.create({
        data: { userId, houseId },
      });
      res.json({
        code: 200,
        data: {
          isFavorite: true,
          action: 'added',
          favoriteId: favorite.id,
        },
      });
    }
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Auth - Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, msg: '请输入用户名和密码' });
    }
    
    const admin = await prisma.admin.findUnique({ where: { username } });
    
    if (!admin) {
      return res.status(401).json({ code: 401, msg: '用户名或密码错误' });
    }
    
    const isValid = await checkPassword(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ code: 401, msg: '用户名或密码错误' });
    }
    
    const token = generateToken({ id: admin.id, username: admin.username, role: 'admin' });

    res.json({
      code: 200,
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
        },
      },
    });
  } catch (err) {
    console.error('Error logging in admin:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// Business Config APIs (业务配置)
// ============================================

// GET /api/config - 获取所有配置
app.get('/api/config', async (req, res) => {
  try {
    const cacheKey = 'business_configs:all';
    const fromCache = cache.get(cacheKey);
    if (fromCache) {
      return res.json(fromCache);
    }

    const configs = await prisma.businessConfig.findMany();
    
    // 转换为 key-value 对象格式
    const data = {};
    for (const config of configs) {
      data[config.key] = config.value;
    }
    
    const payload = { code: 200, data };
    cache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    console.error('Error fetching configs:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/config/:key - 获取单个配置
app.get('/api/config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const config = await prisma.businessConfig.findUnique({
      where: { key },
    });
    
    if (!config) {
      return res.status(404).json({ code: 404, msg: '配置项不存在' });
    }
    
    res.json({ code: 200, data: config });
  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/config/:key - 更新配置（需管理员权限）
app.put('/api/config/:key', verifyAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ code: 400, msg: '请提供配置值' });
    }
    
    const config = await prisma.businessConfig.upsert({
      where: { key },
      update: { 
        value: String(value),
        ...(description !== undefined && { description })
      },
      create: { 
        key, 
        value: String(value),
        description 
      },
    });
    
    // 清除缓存
    cache.del('business_configs:all');
    
    res.json({ code: 200, msg: '配置更新成功', data: config });
  } catch (err) {
    console.error('Error updating config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/config - 创建新配置（需管理员权限）
app.post('/api/config', verifyAdmin, async (req, res) => {
  try {
    const { key, value, description } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ code: 400, msg: '请提供配置键和值' });
    }
    
    const existing = await prisma.businessConfig.findUnique({
      where: { key },
    });
    
    if (existing) {
      return res.status(400).json({ code: 400, msg: '配置键已存在' });
    }
    
    const config = await prisma.businessConfig.create({
      data: { 
        key, 
        value: String(value),
        description 
      },
    });
    
    // 清除缓存
    cache.del('business_configs:all');
    
    res.json({ code: 200, msg: '配置创建成功', data: config });
  } catch (err) {
    console.error('Error creating config:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/config/:key - 删除配置（需管理员权限）
app.delete('/api/config/:key', verifyAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    
    await prisma.businessConfig.delete({
      where: { key },
    });
    
    // 清除缓存
    cache.del('business_configs:all');
    
    res.json({ code: 200, msg: '配置删除成功' });
  } catch (err) {
    console.error('Error deleting config:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ code: 404, msg: '配置项不存在' });
    }
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// Booking APIs (民宿预订)
// ============================================

// 辅助函数：生成订单号
const generateOrderId = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK${date}${random}`;
};

// 辅助函数：获取日期范围内的所有日期
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  // 不包含退房日期
  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// POST /api/bookings - 创建预订
app.post('/api/bookings', async (req, res) => {
  try {
    const { homestayId, checkIn, checkOut, guests, remark, userId, guestName, guestPhone, guestEmail } = req.body;
    
    // 验证必填字段
    if (!homestayId || !checkIn || !checkOut) {
      return res.status(400).json({ code: 400, msg: '请提供民宿ID、入住日期和退房日期' });
    }
    
    // 验证日期
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      return res.status(400).json({ code: 400, msg: '入住日期不能早于今天' });
    }
    
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ code: 400, msg: '退房日期必须晚于入住日期' });
    }
    
    // 获取民宿信息
    const homestay = await prisma.homestay.findUnique({
      where: { id: homestayId },
    });
    
    if (!homestay) {
      return res.status(404).json({ code: 404, msg: '民宿不存在' });
    }
    
    // 计算入住天数和总价
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = homestay.price * nights;
    
    // 获取日期范围内的所有日期
    const dates = getDatesInRange(checkInDate, checkOutDate);
    
    // 确定用户ID：如果是登录用户，使用其ID；否则查找或创建guest用户
    let orderUserId = userId;
    
    if (!orderUserId) {
      // 为未登录用户创建或查找临时用户
      if (guestEmail) {
        // 尝试查找已存在的guest用户
        let guestUser = await prisma.user.findUnique({
          where: { email: guestEmail },
        });
        
        if (!guestUser) {
          // 创建新的guest用户
          guestUser = await prisma.user.create({
            data: {
              username: guestName || guestEmail.split('@')[0],
              email: guestEmail,
              phone: guestPhone || null,
              password: await hashPassword(Math.random().toString(36)), // 随机密码
              role: 'GUEST',
              status: 'active',
            },
          });
        }
        orderUserId = guestUser.id;
      } else {
        return res.status(400).json({ code: 400, msg: '请提供邮箱地址' });
      }
    }
    
    // 使用事务 + 原子 SQL 防止并发超售（核心安全保障）
    // 使用 Serializable 隔离级别 + 原子 UPDATE WHERE 确保库存不被超卖
    const result = await prisma.$transaction(async (tx) => {
      // 对每个日期执行原子 SQL 更新：只有 booked_stock < total_stock 时才成功
      for (const date of dates) {
        const updated = await tx.$executeRaw`
          UPDATE "house_stocks"
          SET "booked_stock" = "booked_stock" + 1
          WHERE "house_id" = ${homestayId}
            AND "date" = ${date}
            AND "booked_stock" < "total_stock"
        `;
        
        if (updated === 0) {
          // 没有行被更新 → 库存不足（原子检查失败，防止超售）
          throw new Error(`日期 ${date.toISOString().split('T')[0]} 无可用房源`);
        }
      }
      
      // 获取业务配置，决定订单状态
      const config = await tx.businessConfig.findUnique({
        where: { key: 'homestay.manual_confirm' },
      });
      
      // 默认需要人工确认
      const needManualConfirm = config?.value !== 'false';
      const status = needManualConfirm ? 'pending' : 'confirmed';
      
      // 创建订单
      const order = await tx.order.create({
        data: {
          orderId: generateOrderId(),
          userId: orderUserId,
          houseId: homestayId,
          type: 'homestay',
          itemName: homestay.title,
          totalPrice,
          status,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests: guests || 1,
        },
      });
      
      return { order, needManualConfirm };
    }, { isolationLevel: 'Serializable' });
    
    // 清除缓存
    cache.del('homestays:all');
    
    res.json({
      code: 200,
      msg: '预订成功',
      data: {
        orderId: result.order.orderId,
        status: result.order.status,
        needManualConfirm: result.needManualConfirm,
        totalPrice: result.order.totalPrice,
        checkIn: result.order.checkIn.toISOString().split('T')[0],
        checkOut: result.order.checkOut.toISOString().split('T')[0],
        nights,
        message: result.needManualConfirm 
          ? '预订已提交，等待管理员确认' 
          : '预订已确认',
      },
    });
  } catch (err) {
    console.error('Error creating booking:', err);
    if (err.message.includes('无可用房源')) {
      return res.status(400).json({ code: 400, msg: err.message });
    }
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/bookings/my - 获取当前用户的订单
app.get('/api/bookings/my', authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { house: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const formatted = orders.map(o => ({
      id: o.orderId,
      homestayId: o.houseId,
      homestay: o.house ? {
        id: o.house.id,
        title: o.house.title,
        location: o.house.location,
        images: o.house.images,
        price: o.house.price,
      } : null,
      checkIn: o.checkIn ? o.checkIn.toISOString().split('T')[0] : null,
      checkOut: o.checkOut ? o.checkOut.toISOString().split('T')[0] : null,
      guests: o.guests,
      totalPrice: o.totalPrice,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching my bookings:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/bookings/:id - 获取订单详情
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { orderId: req.params.id },
      include: { house: true, user: true },
    });
    
    if (!order) {
      return res.status(404).json({ code: 404, msg: '订单不存在' });
    }
    
    res.json({
      code: 200,
      data: {
        id: order.orderId,
        homestayId: order.houseId,
        homestay: order.house ? {
          id: order.house.id,
          title: order.house.title,
          location: order.house.location,
          images: order.house.images,
          price: order.house.price,
          guests: order.house.guests,
          bedrooms: order.house.bedrooms,
        } : null,
        userId: order.userId,
        user: order.user ? {
          id: order.user.id,
          username: order.user.username,
          email: order.user.email,
          phone: order.user.phone,
        } : null,
        checkIn: order.checkIn ? order.checkIn.toISOString().split('T')[0] : null,
        checkOut: order.checkOut ? order.checkOut.toISOString().split('T')[0] : null,
        guests: order.guests,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/bookings/:id/confirm - 确认订单（管理员）
app.put('/api/bookings/:id/confirm', verifyAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { orderId: req.params.id },
      include: { house: true, user: true },
    });
    
    if (!order) {
      return res.status(404).json({ code: 404, msg: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ code: 400, msg: '只能确认待确认状态的订单' });
    }
    
    const updatedOrder = await prisma.order.updateMany({
      where: { orderId: req.params.id },
      data: { status: 'confirmed' },
    });
    
    // 发送通知给用户
    if (order.user) {
      await createNotification(
        order.userId,
        'order_confirmed',
        '订单已确认',
        `您的订单「${order.itemName || order.house?.title || '民宿预订'}」已被确认，请按时入住。`,
        { orderId: order.orderId, houseId: order.houseId }
      );
    }
    
    res.json({ 
      code: 200, 
      msg: '订单已确认',
      data: { orderId: req.params.id, status: 'confirmed' } 
    });
  } catch (err) {
    console.error('Error confirming booking:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/bookings/:id/cancel - 取消订单
app.put('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { orderId: req.params.id },
      include: { house: true, user: true },
    });
    
    if (!order) {
      return res.status(404).json({ code: 404, msg: '订单不存在' });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ code: 400, msg: '订单已取消' });
    }
    
    if (order.status === 'completed') {
      return res.status(400).json({ code: 400, msg: '已完成的订单不能取消' });
    }
    
    // 使用事务处理取消和释放库存
    await prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.order.updateMany({
        where: { orderId: req.params.id },
        data: { status: 'cancelled' },
      });
      
      // 释放库存（减少已预订数量）
      if (order.checkIn && order.checkOut) {
        const dates = getDatesInRange(order.checkIn, order.checkOut);
        for (const date of dates) {
          await tx.houseStock.update({
            where: { houseId_date: { houseId: order.houseId, date } },
            data: { bookedStock: { decrement: 1 } },
          });
        }
      }
    });
    
    // 发送通知给用户
    if (order.user) {
      await createNotification(
        order.userId,
        'order_cancelled',
        '订单已取消',
        `您的订单「${order.itemName || order.house?.title || '民宿预订'}」已被取消。`,
        { orderId: order.orderId, houseId: order.houseId }
      );
    }
    
    // 清除缓存
    cache.del('homestays:all');
    
    res.json({ 
      code: 200, 
      msg: '订单已取消',
      data: { orderId: req.params.id, status: 'cancelled' } 
    });
  } catch (err) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/homestays/:id/stock - 获取民宿库存信息
app.get('/api/homestays/:id/stock', async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;
    
    let queryStartDate, queryEndDate;
    
    // 支持 month 参数 (格式: 2026-02)
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      queryStartDate = new Date(year, mon - 1, 1);
      queryEndDate = new Date(year, mon, 0); // 月末
    } else if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      return res.status(400).json({ code: 400, msg: '请提供 month 或 startDate/endDate 参数' });
    }
    
    const stocks = await prisma.houseStock.findMany({
      where: {
        houseId: req.params.id,
        date: {
          gte: queryStartDate,
          lte: queryEndDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    
    // 转换为日期键对象格式
    const data = {};
    for (const s of stocks) {
      const dateStr = s.date.toISOString().split('T')[0];
      data[dateStr] = {
        total: s.totalStock,
        booked: s.bookedStock,
        available: s.totalStock - s.bookedStock,
        price: s.price,
      };
    }
    
    res.json({ code: 200, data });
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/homestays/:id/init-stock - 初始化库存（管理员）
app.post('/api/homestays/:id/init-stock', verifyAdmin, async (req, res) => {
  try {
    const { totalStock, startDate, endDate, price } = req.body;
    
    if (!totalStock || totalStock < 1) {
      return res.status(400).json({ code: 400, msg: '库存数量必须大于0' });
    }
    
    // 计算日期范围
    let queryStartDate, queryEndDate;
    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      // 默认初始化未来90天
      queryStartDate = new Date();
      queryStartDate.setHours(0, 0, 0, 0);
      queryEndDate = new Date(queryStartDate);
      queryEndDate.setDate(queryEndDate.getDate() + 90);
    }
    
    // 生成库存数据
    const stocks = [];
    const current = new Date(queryStartDate);
    while (current <= queryEndDate) {
      stocks.push({
        houseId: req.params.id,
        date: new Date(current),
        totalStock,
        bookedStock: 0,
        price: price || null,
      });
      current.setDate(current.getDate() + 1);
    }
    
    // 使用 upsert 批量创建或更新库存
    let count = 0;
    for (const stock of stocks) {
      await prisma.houseStock.upsert({
        where: { houseId_date: { houseId: stock.houseId, date: stock.date } },
        update: { totalStock: stock.totalStock, price: stock.price },
        create: stock,
      });
      count++;
    }
    
    // 清除缓存
    cache.del('homestays:all');
    
    res.json({ 
      code: 200, 
      msg: `成功初始化 ${count} 天的库存`,
      data: { count }
    });
  } catch (err) {
    console.error('Error initializing stock:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/homestays/:id/stock/:date - 调整单日库存（管理员）
app.put('/api/homestays/:id/stock/:date', verifyAdmin, async (req, res) => {
  try {
    const { totalStock, price } = req.body;
    const date = new Date(req.params.date);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ code: 400, msg: '无效的日期格式' });
    }
    
    // 检查库存是否存在
    let stock = await prisma.houseStock.findUnique({
      where: { houseId_date: { houseId: req.params.id, date } },
    });
    
    if (stock) {
      // 更新现有库存
      const updateData = {};
      if (totalStock !== undefined) {
        if (totalStock < stock.bookedStock) {
          return res.status(400).json({ 
            code: 400, 
            msg: `总库存不能小于已预订数量 (${stock.bookedStock})` 
          });
        }
        updateData.totalStock = totalStock;
      }
      if (price !== undefined) {
        updateData.price = price;
      }
      
      stock = await prisma.houseStock.update({
        where: { houseId_date: { houseId: req.params.id, date } },
        data: updateData,
      });
    } else {
      // 创建新库存
      stock = await prisma.houseStock.create({
        data: {
          houseId: req.params.id,
          date,
          totalStock: totalStock || 1,
          bookedStock: 0,
          price: price || null,
        },
      });
    }
    
    // 清除缓存
    cache.del('homestays:all');
    
    res.json({
      code: 200,
      msg: '库存更新成功',
      data: {
        date: stock.date.toISOString().split('T')[0],
        total: stock.totalStock,
        booked: stock.bookedStock,
        available: stock.totalStock - stock.bookedStock,
        price: stock.price,
      },
    });
  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/homestays/:id/batch-stock - 批量设置库存（管理员）
app.post('/api/homestays/:id/batch-stock', verifyAdmin, async (req, res) => {
  try {
    const { dates, totalStock, price } = req.body;
    
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ code: 400, msg: '请提供日期数组' });
    }
    
    if (!totalStock || totalStock < 1) {
      return res.status(400).json({ code: 400, msg: '库存数量必须大于0' });
    }
    
    let count = 0;
    for (const dateStr of dates) {
      const date = new Date(dateStr);
      
      await prisma.houseStock.upsert({
        where: { houseId_date: { houseId: req.params.id, date } },
        update: { 
          totalStock,
          ...(price !== undefined && { price }),
        },
        create: {
          houseId: req.params.id,
          date,
          totalStock,
          bookedStock: 0,
          price: price || null,
        },
      });
      count++;
    }
    
    // 清除缓存
    cache.del('homestays:all');
    
    res.json({
      code: 200,
      msg: `成功设置 ${count} 天的库存`,
      data: { count },
    });
  } catch (err) {
    console.error('Error batch updating stock:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/homestays/:id/unavailable-dates - 获取不可用日期（用于前端日历显示）
app.get('/api/homestays/:id/unavailable-dates', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 默认查询未来90天
    const queryStartDate = startDate ? new Date(startDate) : new Date();
    queryStartDate.setHours(0, 0, 0, 0);
    
    const queryEndDate = endDate ? new Date(endDate) : new Date(queryStartDate);
    if (!endDate) {
      queryEndDate.setDate(queryEndDate.getDate() + 90);
    }
    
    // 获取所有库存记录
    const stocks = await prisma.houseStock.findMany({
      where: {
        houseId: req.params.id,
        date: {
          gte: queryStartDate,
          lte: queryEndDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    
    // 找出可用库存为0的日期（满房或未设置库存）
    const unavailableDates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 检查库存记录中可用为0的日期
    for (const stock of stocks) {
      const available = stock.totalStock - stock.bookedStock;
      if (available <= 0) {
        unavailableDates.push(stock.date.toISOString().split('T')[0]);
      }
    }
    
    // 也检查没有库存记录的日期（视为不可用）
    // 只检查有库存记录的情况，未设置的日期前端会显示为"未设置"状态
    
    res.json({ code: 200, data: unavailableDates });
  } catch (err) {
    console.error('Error fetching unavailable dates:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/homestays/:id/stock/cleanup - 清理过期库存（管理员）
app.delete('/api/homestays/:id/stock/cleanup', verifyAdmin, async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 1); // 昨天
    
    const result = await prisma.houseStock.deleteMany({
      where: {
        houseId: req.params.id,
        date: { lt: cutoff },
      },
    });
    
    res.json({
      code: 200,
      msg: `已清理 ${result.count} 条过期库存`,
      data: { count: result.count },
    });
  } catch (err) {
    console.error('Error cleaning up stock:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Auth - Admin Change Password
app.post('/api/admin/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ code: 400, msg: '请提供用户名、当前密码和新密码' });
    }
    
    if (newPassword.length < 5) {
      return res.status(400).json({ code: 400, msg: '新密码长度不能少于5位' });
    }
    
    // 查找管理员
    const admin = await prisma.admin.findUnique({
      where: { username },
    });
    
    if (!admin) {
      return res.status(404).json({ code: 404, msg: '管理员不存在' });
    }
    
    // 验证当前密码
    if (admin.password !== currentPassword) {
      return res.status(401).json({ code: 401, msg: '当前密码错误' });
    }
    
    // 更新密码
    await prisma.admin.update({
      where: { username },
      data: { password: newPassword },
    });
    
    res.json({ code: 200, msg: '密码修改成功' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Seed data endpoint (for initial setup)
app.post('/api/seed', async (req, res) => {
  try {
    // Create sample users
    const user1 = await prisma.user.create({
      data: {
        username: '张三',
        email: 'zhangsan@example.com',
        phone: '+86 138****1234',
        password: 'password123',
        role: 'USER',
        status: 'active',
      },
    });
    
    const user2 = await prisma.user.create({
      data: {
        username: '李四',
        email: 'lisi@example.com',
        phone: '+86 139****5678',
        password: 'password123',
        role: 'USER',
        status: 'active',
      },
    });
    
    // Create sample homestays
    const homestay1 = await prisma.homestay.create({
      data: {
        title: '曼谷市中心豪华公寓',
        location: '曼谷, 泰国',
        price: 3500,
        rating: 4.9,
        reviews: 128,
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
        ],
        type: 'city',
        guests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2,
        amenities: ['WiFi', '空调', '游泳池', '健身房'],
        description: '位于曼谷市中心的豪华公寓，交通便利，设施齐全。',
        hostName: 'Somchai',
        hostAvatar: 'https://i.pravatar.cc/150?u=1',
        isSuperhost: true,
      },
    });
    
    const homestay2 = await prisma.homestay.create({
      data: {
        title: '普吉岛海景别墅',
        location: '普吉岛, 泰国',
        price: 8500,
        rating: 4.8,
        reviews: 96,
        images: [
          'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
          'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
        ],
        type: 'beach',
        guests: 8,
        bedrooms: 4,
        beds: 5,
        bathrooms: 3,
        amenities: ['WiFi', '空调', '私人泳池', '海景'],
        description: '面朝大海的豪华别墅，拥有私人泳池。',
        hostName: 'Nattaya',
        hostAvatar: 'https://i.pravatar.cc/150?u=2',
        isSuperhost: true,
      },
    });
    
    // Create categories
    await prisma.category.createMany({
      data: [
        { labelZh: '全部', labelEn: 'All', labelTh: 'ทั้งหมด', icon: 'home', sortOrder: 1 },
        { labelZh: '海景', labelEn: 'Beach', labelTh: 'ชายหาด', icon: 'waves', sortOrder: 2 },
        { labelZh: '城市', labelEn: 'City', labelTh: 'เมือง', icon: 'building', sortOrder: 3 },
        { labelZh: '别墅', labelEn: 'Villa', labelTh: 'วิลล่า', icon: 'castle', sortOrder: 4 },
        { labelZh: '豪华', labelEn: 'Luxury', labelTh: 'หรูหรา', icon: 'crown', sortOrder: 5 },
        { labelZh: '木屋', labelEn: 'Cabin', labelTh: 'กระท่อม', icon: 'trees', sortOrder: 6 },
      ],
    });
    
    // Create sample orders
    await prisma.order.createMany({
      data: [
        {
          orderId: 'ORD20240601001',
          userId: user1.id,
          houseId: homestay1.id,
          type: 'homestay',
          itemName: '曼谷市中心豪华公寓',
          totalPrice: 10500,
          status: 'completed',
        },
        {
          orderId: 'ORD20240605002',
          userId: user2.id,
          houseId: homestay2.id,
          type: 'homestay',
          itemName: '普吉岛海景别墅',
          totalPrice: 25500,
          status: 'confirmed',
        },
      ],
    });
    
    // Create sample transactions
    await prisma.transaction.createMany({
      data: [
        { type: 'income', amount: 10500, description: '订单ORD20240601001收入' },
        { type: 'income', amount: 25500, description: '订单ORD20240605002收入' },
        { type: 'expense', amount: 5000, description: '商家提现' },
      ],
    });
    
    res.json({ code: 200, msg: 'Seed data created successfully' });
  } catch (err) {
    console.error('Error seeding data:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// 评价 API
// ============================================

 // GET /api/reviews - 获取评价列表（支持按民宿筛选）
 app.get('/api/reviews', async (req, res) => {
   try {
     const { houseId, userId, page = 1, pageSize = 10 } = req.query;
     
     const where = { status: 'active' };
     if (houseId) where.houseId = houseId;
     if (userId) where.userId = userId;
     
     const skip = (parseInt(page) - 1) * parseInt(pageSize);
     
     const [reviews, total, statsData] = await Promise.all([
       prisma.review.findMany({
         where,
         include: {
           user: {
             select: {
               id: true,
               username: true,
               avatar: true,
             },
           },
           house: {
             select: {
               id: true,
               title: true,
               images: true,
             },
           },
           order: {
             select: {
               orderId: true,
               checkIn: true,
               checkOut: true,
             },
           },
         },
         orderBy: { createdAt: 'desc' },
         skip,
         take: parseInt(pageSize),
       }),
       prisma.review.count({ where }),
       // 获取统计信息
       houseId ? prisma.review.findMany({
         where: { houseId, status: 'active' },
         select: { rating: true },
       }) : null,
     ]);
     
     const data = reviews.map(r => ({
       id: r.id,
       rating: r.rating,
       content: r.content,
       images: r.images,
       reply: r.reply,
       replyAt: r.replyAt?.toISOString(),
       createdAt: r.createdAt.toISOString(),
       user: {
         id: r.user.id,
         name: r.user.username,
         avatar: r.user.avatar,
       },
       house: {
         id: r.house.id,
         title: r.house.title,
         image: r.house.images[0],
       },
       order: r.order ? {
         orderId: r.order.orderId,
         checkIn: r.order.checkIn?.toISOString().split('T')[0],
         checkOut: r.order.checkOut?.toISOString().split('T')[0],
       } : null,
     }));
     
     // 计算统计信息
     let stats = null;
     if (statsData && statsData.length > 0) {
       const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
       let sum = 0;
       statsData.forEach(r => {
         distribution[r.rating] = (distribution[r.rating] || 0) + 1;
         sum += r.rating;
       });
       stats = {
         average: Math.round((sum / statsData.length) * 10) / 10,
         total: statsData.length,
         distribution,
       };
     }
     
     res.json({
       code: 200,
       data: {
         reviews: data,
         total,
         page: parseInt(page),
         pageSize: parseInt(pageSize),
         stats,
       },
     });
   } catch (err) {
     console.error('Error fetching reviews:', err);
     res.status(500).json({ code: 500, msg: err.message });
   }
 });

// GET /api/reviews/:id - 获取单个评价详情
app.get('/api/reviews/:id', async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        house: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        order: {
          select: {
            orderId: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
    });
    
    if (!review) {
      return res.status(404).json({ code: 404, msg: '评价不存在' });
    }
    
    res.json({
      code: 200,
      data: {
        id: review.id,
        rating: review.rating,
        content: review.content,
        images: review.images,
        reply: review.reply,
        replyAt: review.replyAt?.toISOString(),
        status: review.status,
        createdAt: review.createdAt.toISOString(),
        user: {
          id: review.user.id,
          name: review.user.username,
          avatar: review.user.avatar,
        },
        house: {
          id: review.house.id,
          title: review.house.title,
          image: review.house.images[0],
        },
        order: review.order ? {
          orderId: review.order.orderId,
          checkIn: review.order.checkIn?.toISOString().split('T')[0],
          checkOut: review.order.checkOut?.toISOString().split('T')[0],
        } : null,
      },
    });
  } catch (err) {
    console.error('Error fetching review:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/reviews - 创建评价
app.post('/api/reviews', authMiddleware, async (req, res) => {
  try {
    const { orderId, houseId, rating, content, images } = req.body;
    const userId = req.user.id;
    
    // 参数验证
    if (!orderId || !houseId || !rating) {
      return res.status(400).json({ code: 400, msg: '请提供订单ID、民宿ID和评分' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ code: 400, msg: '评分必须在1-5之间' });
    }
    
    if (content && content.length > 200) {
      return res.status(400).json({ code: 400, msg: '评价内容不能超过200字' });
    }
    
    if (images && images.length > 3) {
      return res.status(400).json({ code: 400, msg: '评价图片最多3张' });
    }
    
    // 检查订单是否存在且属于当前用户
    const order = await prisma.order.findUnique({
      where: { orderId },
    });
    
    if (!order) {
      return res.status(404).json({ code: 404, msg: '订单不存在' });
    }
    
    if (order.userId !== userId) {
      return res.status(403).json({ code: 403, msg: '无权评价此订单' });
    }
    
    if (order.houseId !== houseId) {
      return res.status(400).json({ code: 400, msg: '订单与民宿不匹配' });
    }
    
    // 检查订单状态是否为已完成
    if (order.status !== 'completed') {
      return res.status(400).json({ code: 400, msg: '只能评价已完成的订单' });
    }
    
    // 检查是否已评价
    const existingReview = await prisma.review.findUnique({
      where: { orderId: order.id },
    });
    
    if (existingReview) {
      return res.status(400).json({ code: 400, msg: '该订单已评价' });
    }
    
    // 创建评价
    const review = await prisma.review.create({
      data: {
        userId,
        houseId,
        orderId: order.id,  // 使用 Order 表的主键 id
        rating,
        content: content || null,
        images: images || [],
        status: 'active',
      },
    });
    
    // 更新民宿评分和评价数
    const allReviews = await prisma.review.findMany({
      where: { houseId, status: 'active' },
      select: { rating: true },
    });
    
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await prisma.homestay.update({
      where: { id: houseId },
      data: {
        rating: Math.round(avgRating * 10) / 10, // 保留一位小数
        reviews: allReviews.length,
      },
    });
    
    // 清除缓存
    cache.del('homestays:all');
    
    res.json({
      code: 200,
      msg: '评价成功',
      data: {
        id: review.id,
        rating: review.rating,
        content: review.content,
        images: review.images,
        createdAt: review.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/reviews/:id - 更新评价（仅限创建者）
app.put('/api/reviews/:id', authMiddleware, async (req, res) => {
  try {
    const { rating, content, images } = req.body;
    const userId = req.user.id;
    
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
    });
    
    if (!review) {
      return res.status(404).json({ code: 404, msg: '评价不存在' });
    }
    
    if (review.userId !== userId) {
      return res.status(403).json({ code: 403, msg: '无权修改此评价' });
    }
    
    // 参数验证
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ code: 400, msg: '评分必须在1-5之间' });
    }
    
    if (content && content.length > 200) {
      return res.status(400).json({ code: 400, msg: '评价内容不能超过200字' });
    }
    
    if (images && images.length > 3) {
      return res.status(400).json({ code: 400, msg: '评价图片最多3张' });
    }
    
    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (content !== undefined) updateData.content = content || null;
    if (images !== undefined) updateData.images = images;
    
    const updatedReview = await prisma.review.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    // 如果评分更新了，重新计算民宿平均分
    if (rating !== undefined) {
      const allReviews = await prisma.review.findMany({
        where: { houseId: review.houseId, status: 'active' },
        select: { rating: true },
      });
      
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await prisma.homestay.update({
        where: { id: review.houseId },
        data: { rating: Math.round(avgRating * 10) / 10 },
      });
      
      cache.del('homestays:all');
    }
    
    res.json({
      code: 200,
      msg: '评价更新成功',
      data: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        content: updatedReview.content,
        images: updatedReview.images,
        updatedAt: updatedReview.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/reviews/:id - 删除评价（仅限创建者或管理员）
app.delete('/api/reviews/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
    });
    
    if (!review) {
      return res.status(404).json({ code: 404, msg: '评价不存在' });
    }
    
    if (review.userId !== userId && !isAdmin) {
      return res.status(403).json({ code: 403, msg: '无权删除此评价' });
    }
    
    await prisma.review.delete({
      where: { id: req.params.id },
    });
    
    // 重新计算民宿评分
    const allReviews = await prisma.review.findMany({
      where: { houseId: review.houseId, status: 'active' },
      select: { rating: true },
    });
    
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 4.5; // 默认评分
    
    await prisma.homestay.update({
      where: { id: review.houseId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviews: allReviews.length,
      },
    });
    
    cache.del('homestays:all');
    
    res.json({ code: 200, msg: '评价已删除' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/reviews/:id/reply - 管理员回复评价
app.post('/api/reviews/:id/reply', verifyAdmin, async (req, res) => {
  try {
    const { reply } = req.body;
    
    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({ code: 400, msg: '回复内容不能为空' });
    }
    
    if (reply.length > 500) {
      return res.status(400).json({ code: 400, msg: '回复内容不能超过500字' });
    }
    
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
    });
    
    if (!review) {
      return res.status(404).json({ code: 404, msg: '评价不存在' });
    }
    
    const updatedReview = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        reply: reply.trim(),
        replyAt: new Date(),
      },
    });
    
    res.json({
      code: 200,
      msg: '回复成功',
      data: {
        id: updatedReview.id,
        reply: updatedReview.reply,
        replyAt: updatedReview.replyAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error replying review:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/reviews/:id/status - 更新评价状态（管理员）
app.put('/api/reviews/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'hidden'].includes(status)) {
      return res.status(400).json({ code: 400, msg: '无效的状态' });
    }
    
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
    });
    
    if (!review) {
      return res.status(404).json({ code: 404, msg: '评价不存在' });
    }
    
    const updatedReview = await prisma.review.update({
      where: { id: req.params.id },
      data: { status },
    });
    
    // 重新计算民宿评分（隐藏的评价不计入）
    const allReviews = await prisma.review.findMany({
      where: { houseId: review.houseId, status: 'active' },
      select: { rating: true },
    });
    
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 4.5;
    
    await prisma.homestay.update({
      where: { id: review.houseId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviews: allReviews.length,
      },
    });
    
    cache.del('homestays:all');
    
    res.json({
      code: 200,
      msg: '状态更新成功',
      data: {
        id: updatedReview.id,
        status: updatedReview.status,
      },
    });
  } catch (err) {
    console.error('Error updating review status:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/reviews/stats/:houseId - 获取民宿评价统计
app.get('/api/reviews/stats/:houseId', async (req, res) => {
  try {
    const { houseId } = req.params;
    
    const reviews = await prisma.review.findMany({
      where: { houseId, status: 'active' },
      select: { rating: true },
    });
    
    const total = reviews.length;
    const avgRating = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;
    
    // 计算各星级数量
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      ratingCounts[r.rating]++;
    }
    
    res.json({
      code: 200,
      data: {
        total,
        avgRating: Math.round(avgRating * 10) / 10,
        ratingCounts,
      },
    });
  } catch (err) {
    console.error('Error fetching review stats:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/orders/completed - 获取用户已完成的订单（用于评价）
app.get('/api/orders/completed', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'completed',
      },
      include: {
        house: {
          select: {
            id: true,
            title: true,
            images: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // 检查哪些订单已经评价过
    const orderIds = orders.map(o => o.id);
    const existingReviews = await prisma.review.findMany({
      where: {
        orderId: { in: orderIds },
      },
      select: { orderId: true },
    });
    
    const reviewedOrderIds = new Set(existingReviews.map(r => r.orderId));
    
    const data = orders.map(o => ({
      id: o.id,
      orderId: o.orderId,
      itemName: o.itemName,
      totalPrice: o.totalPrice,
      checkIn: o.checkIn?.toISOString().split('T')[0],
      checkOut: o.checkOut?.toISOString().split('T')[0],
      createdAt: o.createdAt.toISOString(),
      house: o.house ? {
        id: o.house.id,
        title: o.house.title,
        image: o.house.images[0],
        location: o.house.location,
      } : null,
      hasReviewed: reviewedOrderIds.has(o.id),
    }));
    
    res.json({ code: 200, data });
  } catch (err) {
    console.error('Error fetching completed orders:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// Notification Helper Functions
// ============================================

/**
 * 创建通知的辅助函数
 * @param {string} userId - 用户ID
 * @param {string} type - 通知类型：order_confirmed, order_cancelled, review_reminder, system
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @param {object} data - 附加数据（可选）
 */
async function createNotification(userId, type, title, content, data = null) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        data: data ? JSON.stringify(data) : null,
      },
    });
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    // 不抛出错误，避免影响主流程
    return null;
  }
}

/**
 * 清理30天前的已读通知
 */
async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: thirtyDaysAgo },
      },
    });
    return result.count;
  } catch (err) {
    console.error('Error cleaning up notifications:', err);
    return 0;
  }
}

// ============================================
// Notification APIs (消息通知)
// ============================================

// GET /api/notifications - 获取用户通知列表
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const where = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }
    
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });
    
    // 获取总数和未读数
    const total = await prisma.notification.count({ where: { userId } });
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    
    const data = notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      data: n.data ? JSON.parse(n.data) : null,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
    
    res.json({
      code: 200,
      data: {
        list: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
        unreadCount,
      },
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/notifications/unread-count - 获取未读通知数量
app.get('/api/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    
    res.json({ code: 200, data: { count } });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/notifications/:id/read - 标记单条通知为已读
app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    
    if (!notification) {
      return res.status(404).json({ code: 404, msg: '通知不存在' });
    }
    
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    
    res.json({ code: 200, msg: '已标记为已读' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/notifications/read-all - 标记所有通知为已读
app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    
    res.json({
      code: 200,
      msg: '已标记全部已读',
      data: { count: result.count },
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/notifications/:id - 删除单条通知
app.delete('/api/notifications/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    
    if (!notification) {
      return res.status(404).json({ code: 404, msg: '通知不存在' });
    }
    
    await prisma.notification.delete({
      where: { id },
    });
    
    res.json({ code: 200, msg: '通知已删除' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/notifications/cleanup - 清理过期通知（管理员）
app.delete('/api/notifications/cleanup', verifyAdmin, async (req, res) => {
  try {
    const count = await cleanupOldNotifications();
    res.json({
      code: 200,
      msg: `已清理 ${count} 条过期通知`,
      data: { count },
    });
  } catch (err) {
    console.error('Error cleaning up notifications:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// Cost APIs (成本核算)
// ============================================

// 成本类型定义
const COST_TYPES = {
  rent: { label: '房租', color: '#1890ff' },
  utilities: { label: '水电费', color: '#52c41a' },
  salary: { label: '员工工资', color: '#faad14' },
  maintenance: { label: '维护费', color: '#eb2f96' },
  procurement: { label: '采购费', color: '#722ed1' },
  other: { label: '其他', color: '#8c8c8c' },
};

// GET /api/costs/types - 获取成本类型列表
app.get('/api/costs/types', (req, res) => {
  const types = Object.entries(COST_TYPES).map(([key, value]) => ({
    value: key,
    label: value.label,
    color: value.color,
  }));
  res.json({ code: 200, data: types });
});

// GET /api/costs - 获取成本列表（支持筛选）
app.get('/api/costs', async (req, res) => {
  try {
    const { costType, status, startDate, endDate, page = 1, pageSize = 20 } = req.query;
    
    const where = {};
    if (costType) where.costType = costType;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    
    const [costs, total] = await Promise.all([
      prisma.cost.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(pageSize),
      }),
      prisma.cost.count({ where }),
    ]);
    
    const data = costs.map(c => ({
      id: c.id,
      costType: c.costType,
      costTypeLabel: COST_TYPES[c.costType]?.label || c.costType,
      amount: c.amount,
      date: c.date.toISOString().split('T')[0],
      description: c.description,
      relatedId: c.relatedId,
      relatedType: c.relatedType,
      status: c.status,
      remark: c.remark,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
    
    res.json({
      code: 200,
      data: {
        list: data,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize)),
        },
      },
    });
  } catch (err) {
    console.error('Error fetching costs:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/costs/stats - 获取成本统计（必须在 :id 之前定义）
app.get('/api/costs/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = { status: 'confirmed' };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    // 获取所有符合条件的成本
    const costs = await prisma.cost.findMany({
      where,
      select: {
        costType: true,
        amount: true,
        date: true,
      },
    });
    
    // 总成本
    const totalCost = costs.reduce((sum, c) => sum + c.amount, 0);
    
    // 按类型统计
    const byType = {};
    for (const cost of costs) {
      if (!byType[cost.costType]) {
        byType[cost.costType] = {
          type: cost.costType,
          label: COST_TYPES[cost.costType]?.label || cost.costType,
          color: COST_TYPES[cost.costType]?.color || '#8c8c8c',
          amount: 0,
          count: 0,
        };
      }
      byType[cost.costType].amount += cost.amount;
      byType[cost.costType].count += 1;
    }
    
    // 按月份统计（趋势）
    const byMonth = {};
    for (const cost of costs) {
      const monthKey = cost.date.toISOString().slice(0, 7); // YYYY-MM
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          month: monthKey,
          amount: 0,
          count: 0,
        };
      }
      byMonth[monthKey].amount += cost.amount;
      byMonth[monthKey].count += 1;
    }
    
    // 获取收入数据（从 Order 表）
    const incomeWhere = { status: 'completed' };
    if (startDate || endDate) {
      incomeWhere.createdAt = {};
      if (startDate) incomeWhere.createdAt.gte = new Date(startDate);
      if (endDate) incomeWhere.createdAt.lte = new Date(endDate);
    }
    
    const orders = await prisma.order.findMany({
      where: incomeWhere,
      select: {
        totalPrice: true,
        createdAt: true,
      },
    });
    
    const totalIncome = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const profit = totalIncome - totalCost;
    
    // 按月份收入统计
    const incomeByMonth = {};
    for (const order of orders) {
      const monthKey = order.createdAt.toISOString().slice(0, 7);
      if (!incomeByMonth[monthKey]) {
        incomeByMonth[monthKey] = {
          month: monthKey,
          income: 0,
        };
      }
      incomeByMonth[monthKey].income += order.totalPrice;
    }
    
    // 合并月度数据
    const allMonths = new Set([
      ...Object.keys(byMonth),
      ...Object.keys(incomeByMonth),
    ]);
    const monthlyTrend = Array.from(allMonths).sort().map(month => ({
      month,
      cost: byMonth[month]?.amount || 0,
      income: incomeByMonth[month]?.income || 0,
      profit: (incomeByMonth[month]?.income || 0) - (byMonth[month]?.amount || 0),
    }));
    
    res.json({
      code: 200,
      data: {
        summary: {
          totalCost,
          totalIncome,
          profit,
          profitMargin: totalIncome > 0 ? Math.round((profit / totalIncome) * 100) : 0,
        },
        byType: Object.values(byType).sort((a, b) => b.amount - a.amount),
        monthlyTrend,
      },
    });
  } catch (err) {
    console.error('Error fetching cost stats:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/costs/:id - 获取单条成本详情
app.get('/api/costs/:id', async (req, res) => {
  try {
    const cost = await prisma.cost.findUnique({
      where: { id: req.params.id },
    });
    
    if (!cost) {
      return res.status(404).json({ code: 404, msg: '成本记录不存在' });
    }
    
    res.json({
      code: 200,
      data: {
        id: cost.id,
        costType: cost.costType,
        costTypeLabel: COST_TYPES[cost.costType]?.label || cost.costType,
        amount: cost.amount,
        date: cost.date.toISOString().split('T')[0],
        description: cost.description,
        relatedId: cost.relatedId,
        relatedType: cost.relatedType,
        status: cost.status,
        remark: cost.remark,
        createdAt: cost.createdAt.toISOString(),
        updatedAt: cost.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error fetching cost:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/costs - 创建成本记录
app.post('/api/costs', verifyAdmin, async (req, res) => {
  try {
    const { costType, amount, date, description, relatedId, relatedType, remark } = req.body;
    
    // 参数验证
    if (!costType || !amount || !date) {
      return res.status(400).json({ code: 400, msg: '请提供成本类型、金额和日期' });
    }
    
    if (!COST_TYPES[costType]) {
      return res.status(400).json({ code: 400, msg: '无效的成本类型' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ code: 400, msg: '金额必须大于0' });
    }
    
    const cost = await prisma.cost.create({
      data: {
        costType,
        amount,
        date: new Date(date),
        description: description || null,
        relatedId: relatedId || null,
        relatedType: relatedType || null,
        status: 'confirmed',
        remark: remark || null,
      },
    });
    
    res.json({
      code: 200,
      msg: '成本记录创建成功',
      data: {
        id: cost.id,
        costType: cost.costType,
        costTypeLabel: COST_TYPES[cost.costType]?.label || cost.costType,
        amount: cost.amount,
        date: cost.date.toISOString().split('T')[0],
        description: cost.description,
        status: cost.status,
      },
    });
  } catch (err) {
    console.error('Error creating cost:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/costs/:id - 更新成本记录
app.put('/api/costs/:id', verifyAdmin, async (req, res) => {
  try {
    const { costType, amount, date, description, relatedId, relatedType, status, remark } = req.body;
    
    const existingCost = await prisma.cost.findUnique({
      where: { id: req.params.id },
    });
    
    if (!existingCost) {
      return res.status(404).json({ code: 404, msg: '成本记录不存在' });
    }
    
    // 参数验证
    if (costType && !COST_TYPES[costType]) {
      return res.status(400).json({ code: 400, msg: '无效的成本类型' });
    }
    
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ code: 400, msg: '金额必须大于0' });
    }
    
    const updateData = {};
    if (costType) updateData.costType = costType;
    if (amount !== undefined) updateData.amount = amount;
    if (date) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description || null;
    if (relatedId !== undefined) updateData.relatedId = relatedId || null;
    if (relatedType !== undefined) updateData.relatedType = relatedType || null;
    if (status) updateData.status = status;
    if (remark !== undefined) updateData.remark = remark || null;
    
    const cost = await prisma.cost.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    res.json({
      code: 200,
      msg: '成本记录更新成功',
      data: {
        id: cost.id,
        costType: cost.costType,
        costTypeLabel: COST_TYPES[cost.costType]?.label || cost.costType,
        amount: cost.amount,
        date: cost.date.toISOString().split('T')[0],
        description: cost.description,
        status: cost.status,
      },
    });
  } catch (err) {
    console.error('Error updating cost:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/costs/:id - 删除成本记录
app.delete('/api/costs/:id', verifyAdmin, async (req, res) => {
  try {
    const cost = await prisma.cost.findUnique({
      where: { id: req.params.id },
    });
    
    if (!cost) {
      return res.status(404).json({ code: 404, msg: '成本记录不存在' });
    }
    
    await prisma.cost.delete({
      where: { id: req.params.id },
    });
    
    res.json({ code: 200, msg: '成本记录已删除' });
  } catch (err) {
    console.error('Error deleting cost:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// =====================================================
// 运营报表 API - F014
// =====================================================

// 辅助函数：获取日期范围
function getDateRange(startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// GET /api/reports/overview - 综合报表概览（管理员）
app.get('/api/reports/overview', verifyAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    // 并行获取所有统计数据
    const [
      orders,
      users,
      costs,
      homestays,
      mealOrders,
      carRentals,
      ticketOrders
    ] = await Promise.all([
      // 订单统计
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { totalPrice: true, status: true, type: true, createdAt: true }
      }),
      // 用户统计
      prisma.user.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, createdAt: true }
      }),
      // 成本统计
      prisma.cost.findMany({
        where: { date: { gte: start, lte: end }, status: 'confirmed' },
        select: { amount: true, costType: true }
      }),
      // 民宿统计
      prisma.homestay.count(),
      // 餐饮订单
      prisma.mealOrder.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { totalPrice: true, status: true }
      }),
      // 车辆租赁
      prisma.carRental.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { totalPrice: true, status: true }
      }),
      // 票务订单
      prisma.ticketOrder.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { totalPrice: true, status: true }
      })
    ]);

    // 计算收入
    const homestayRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0);
    const mealRevenue = mealOrders.filter(o => o.status === 'COMPLETED' || o.status === 'CONFIRMED').reduce((sum, o) => sum + o.totalPrice, 0);
    const carRevenue = carRentals.filter(o => o.status === 'COMPLETED' || o.status === 'CONFIRMED').reduce((sum, o) => sum + o.totalPrice, 0);
    const ticketRevenue = ticketOrders.filter(o => o.status === 'COMPLETED' || o.status === 'CONFIRMED').reduce((sum, o) => sum + o.totalPrice, 0);
    const totalRevenue = homestayRevenue + mealRevenue + carRevenue + ticketRevenue;

    // 计算成本
    const totalCost = costs.reduce((sum, c) => sum + c.amount, 0);

    // 订单状态分布
    const orderStatusDistribution = {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    // 订单类型分布
    const orderTypeDistribution = {
      homestay: orders.filter(o => o.type === 'homestay').length,
      car: orders.filter(o => o.type === 'car').length,
      ticket: orders.filter(o => o.type === 'ticket').length,
      dining: orders.filter(o => o.type === 'dining').length,
    };

    res.json({
      code: 200,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        revenue: {
          total: totalRevenue,
          homestay: homestayRevenue,
          meal: mealRevenue,
          car: carRevenue,
          ticket: ticketRevenue,
        },
        cost: {
          total: totalCost,
          profit: totalRevenue - totalCost,
          profitMargin: totalRevenue > 0 ? Math.round((totalRevenue - totalCost) / totalRevenue * 100) : 0,
        },
        orders: {
          total: orders.length,
          homestay: orders.length,
          meal: mealOrders.length,
          car: carRentals.length,
          ticket: ticketOrders.length,
          statusDistribution: orderStatusDistribution,
          typeDistribution: orderTypeDistribution,
        },
        users: {
          newUsers: users.length,
          totalHomestays: homestays,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching report overview:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/reports/revenue - 收入报表（按日期趋势）（管理员）
app.get('/api/reports/revenue', verifyAdmin, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    // 获取所有收入来源
    const [orders, mealOrders, carRentals, ticketOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end }, status: 'completed' },
        select: { totalPrice: true, createdAt: true, type: true }
      }),
      prisma.mealOrder.findMany({
        where: { createdAt: { gte: start, lte: end }, status: { in: ['COMPLETED', 'CONFIRMED'] } },
        select: { totalPrice: true, createdAt: true }
      }),
      prisma.carRental.findMany({
        where: { createdAt: { gte: start, lte: end }, status: { in: ['COMPLETED', 'CONFIRMED'] } },
        select: { totalPrice: true, createdAt: true }
      }),
      prisma.ticketOrder.findMany({
        where: { createdAt: { gte: start, lte: end }, status: { in: ['COMPLETED', 'CONFIRMED'] } },
        select: { totalPrice: true, createdAt: true }
      })
    ]);

    // 按日期分组
    const revenueByDate = {};

    const addToDate = (date, amount, type) => {
      const d = new Date(date);
      let key;
      if (groupBy === 'week') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      } else {
        key = d.toISOString().split('T')[0];
      }

      if (!revenueByDate[key]) {
        revenueByDate[key] = { date: key, homestay: 0, meal: 0, car: 0, ticket: 0, total: 0 };
      }
      revenueByDate[key][type] += amount;
      revenueByDate[key].total += amount;
    };

    orders.forEach(o => addToDate(o.createdAt, o.totalPrice, 'homestay'));
    mealOrders.forEach(o => addToDate(o.createdAt, o.totalPrice, 'meal'));
    carRentals.forEach(o => addToDate(o.createdAt, o.totalPrice, 'car'));
    ticketOrders.forEach(o => addToDate(o.createdAt, o.totalPrice, 'ticket'));

    // 转换为数组并排序
    const trend = Object.values(revenueByDate).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      code: 200,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        groupBy,
        trend,
        summary: {
          totalRevenue: trend.reduce((sum, d) => sum + d.total, 0),
          avgDaily: trend.length > 0 ? Math.round(trend.reduce((sum, d) => sum + d.total, 0) / trend.length) : 0,
        }
      }
    });
  } catch (err) {
    console.error('Error fetching revenue report:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/reports/orders - 订单统计报表（管理员）
app.get('/api/reports/orders', verifyAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const [orders, mealOrders, carRentals, ticketOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, status: true, type: true, totalPrice: true, createdAt: true, houseId: true }
      }),
      prisma.mealOrder.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, status: true, totalPrice: true, createdAt: true, mealConfigId: true }
      }),
      prisma.carRental.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, status: true, totalPrice: true, createdAt: true, carConfigId: true }
      }),
      prisma.ticketOrder.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, status: true, totalPrice: true, createdAt: true, ticketConfigId: true }
      })
    ]);

    // 订单状态分布
    const getStatusCount = (list, statusField = 'status') => {
      return {
        pending: list.filter(o => o[statusField] === 'pending' || o[statusField] === 'PENDING').length,
        confirmed: list.filter(o => o[statusField] === 'confirmed' || o[statusField] === 'CONFIRMED').length,
        completed: list.filter(o => o[statusField] === 'completed' || o[statusField] === 'COMPLETED').length,
        cancelled: list.filter(o => o[statusField] === 'cancelled' || o[statusField] === 'CANCELLED').length,
      };
    };

    // 按日期分组
    const ordersByDate = {};
    const addOrderByDate = (date, type) => {
      const key = new Date(date).toISOString().split('T')[0];
      if (!ordersByDate[key]) {
        ordersByDate[key] = { date: key, homestay: 0, meal: 0, car: 0, ticket: 0, total: 0 };
      }
      ordersByDate[key][type]++;
      ordersByDate[key].total++;
    };

    orders.forEach(o => addOrderByDate(o.createdAt, 'homestay'));
    mealOrders.forEach(o => addOrderByDate(o.createdAt, 'meal'));
    carRentals.forEach(o => addOrderByDate(o.createdAt, 'car'));
    ticketOrders.forEach(o => addOrderByDate(o.createdAt, 'ticket'));

    const trend = Object.values(ordersByDate).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      code: 200,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        total: orders.length + mealOrders.length + carRentals.length + ticketOrders.length,
        byType: {
          homestay: { count: orders.length, status: getStatusCount(orders) },
          meal: { count: mealOrders.length, status: getStatusCount(mealOrders) },
          car: { count: carRentals.length, status: getStatusCount(carRentals) },
          ticket: { count: ticketOrders.length, status: getStatusCount(ticketOrders) },
        },
        trend,
      }
    });
  } catch (err) {
    console.error('Error fetching orders report:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/reports/users - 用户增长报表（管理员）
app.get('/api/reports/users', verifyAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const [newUsers, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, createdAt: true, role: true }
      }),
      prisma.user.count()
    ]);

    // 按日期分组
    const usersByDate = {};
    newUsers.forEach(u => {
      const key = new Date(u.createdAt).toISOString().split('T')[0];
      if (!usersByDate[key]) {
        usersByDate[key] = { date: key, count: 0 };
      }
      usersByDate[key].count++;
    });

    const trend = Object.values(usersByDate).sort((a, b) => a.date.localeCompare(b.date));

    // 累计用户数
    let cumulative = 0;
    const cumulativeTrend = trend.map(d => {
      cumulative += d.count;
      return { ...d, cumulative };
    });

    res.json({
      code: 200,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        newUsers: newUsers.length,
        totalUsers,
        avgDaily: trend.length > 0 ? Math.round(newUsers.length / trend.length) : 0,
        trend: cumulativeTrend,
      }
    });
  } catch (err) {
    console.error('Error fetching users report:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/reports/homestays - 房源报表（预订率、热门房源）（管理员）
app.get('/api/reports/homestays', verifyAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const [homestays, orders, stocks] = await Promise.all([
      prisma.homestay.findMany({
        select: { id: true, title: true, price: true, rating: true, reviews: true }
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end }, type: 'homestay' },
        select: { houseId: true, status: true, totalPrice: true }
      }),
      prisma.houseStock.findMany({
        where: { date: { gte: start, lte: end } },
        select: { houseId: true, totalStock: true, bookedStock: true }
      })
    ]);

    // 房源预订统计
    const homestayStats = homestays.map(h => {
      const homestayOrders = orders.filter(o => o.houseId === h.id);
      const homestayStocks = stocks.filter(s => s.houseId === h.id);
      const totalStock = homestayStocks.reduce((sum, s) => sum + s.totalStock, 0);
      const bookedStock = homestayStocks.reduce((sum, s) => sum + s.bookedStock, 0);

      return {
        id: h.id,
        title: h.title,
        price: h.price,
        rating: h.rating,
        reviews: h.reviews,
        orderCount: homestayOrders.length,
        completedOrders: homestayOrders.filter(o => o.status === 'completed').length,
        revenue: homestayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0),
        bookingRate: totalStock > 0 ? Math.round(bookedStock / totalStock * 100) : 0,
      };
    });

    // 按收入排序（热门房源）
    const topByRevenue = [...homestayStats].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const topByOrders = [...homestayStats].sort((a, b) => b.orderCount - a.orderCount).slice(0, 10);

    res.json({
      code: 200,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        totalHomestays: homestays.length,
        totalOrders: orders.length,
        totalRevenue: homestayStats.reduce((sum, h) => sum + h.revenue, 0),
        avgBookingRate: homestayStats.length > 0 ? Math.round(homestayStats.reduce((sum, h) => sum + h.bookingRate, 0) / homestayStats.length) : 0,
        topByRevenue,
        topByOrders,
        all: homestayStats,
      }
    });
  } catch (err) {
    console.error('Error fetching homestays report:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// Calendar View APIs (日历汇总视图)
// ============================================

// GET /api/calendar/rooms - 获取房间库存汇总日历
app.get('/api/calendar/rooms', verifyAdmin, async (req, res) => {
  try {
    const { month } = req.query;
    
    let startDate, endDate;
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      startDate = new Date(year, mon - 1, 1);
      endDate = new Date(year, mon, 0);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    // 获取所有民宿
    const homestays = await prisma.homestay.findMany({
      select: { id: true, title: true, price: true },
    });
    
    // 获取日期范围内的所有库存
    const stocks = await prisma.houseStock.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });
    
    // 按日期组织数据
    const calendar = {};
    for (const stock of stocks) {
      const dateStr = stock.date.toISOString().split('T')[0];
      if (!calendar[dateStr]) {
        calendar[dateStr] = {
          totalRooms: 0,
          totalStock: 0,
          totalBooked: 0,
          homestays: [],
        };
      }
      calendar[dateStr].totalRooms++;
      calendar[dateStr].totalStock += stock.totalStock;
      calendar[dateStr].totalBooked += stock.bookedStock;
      const homestay = homestays.find(h => h.id === stock.houseId);
      if (homestay) {
        calendar[dateStr].homestays.push({
          id: stock.houseId,
          title: homestay.title,
          total: stock.totalStock,
          booked: stock.bookedStock,
          available: stock.totalStock - stock.bookedStock,
          price: stock.price || homestay.price,
        });
      }
    }
    
    // 计算每个日期的可用状态
    const result = {};
    for (const [dateStr, data] of Object.entries(calendar)) {
      const totalAvailable = data.totalStock - data.totalBooked;
      let status = 'unknown';
      if (data.totalStock > 0) {
        const availableRate = totalAvailable / data.totalStock;
        if (availableRate > 0.5) status = 'available';
        else if (availableRate > 0.1) status = 'limited';
        else status = 'full';
      }
      
      result[dateStr] = {
        ...data,
        totalAvailable,
        status,
      };
    }
    
    res.json({
      code: 200,
      data: {
        month: month || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
        homestays,
        calendar: result,
      }
    });
  } catch (err) {
    console.error('Error fetching room calendar:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/calendar/cars - 获取车辆库存汇总日历
app.get('/api/calendar/cars', verifyAdmin, async (req, res) => {
  try {
    const { month } = req.query;
    
    let startDate, endDate;
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      startDate = new Date(year, mon - 1, 1);
      endDate = new Date(year, mon, 0);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    // 获取所有车辆配置
    const carConfigs = await prisma.carConfig.findMany({
      select: { id: true, name: true, price: true, carType: true, hasDriver: true },
      where: { isActive: true },
    });
    
    // 获取日期范围内的所有库存
    const stocks = await prisma.carStock.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });
    
    // 按日期组织数据
    const calendar = {};
    for (const stock of stocks) {
      const dateStr = stock.date.toISOString().split('T')[0];
      if (!calendar[dateStr]) {
        calendar[dateStr] = {
          totalCars: 0,
          totalStock: 0,
          totalBooked: 0,
          cars: [],
        };
      }
      calendar[dateStr].totalCars++;
      calendar[dateStr].totalStock += stock.totalStock;
      calendar[dateStr].totalBooked += stock.bookedStock;
      const car = carConfigs.find(c => c.id === stock.carConfigId);
      if (car) {
        calendar[dateStr].cars.push({
          id: stock.carConfigId,
          name: car.name,
          carType: car.carType,
          hasDriver: car.hasDriver,
          total: stock.totalStock,
          booked: stock.bookedStock,
          available: stock.totalStock - stock.bookedStock,
          price: stock.price || car.price,
        });
      }
    }
    
    // 计算每个日期的可用状态
    const result = {};
    for (const [dateStr, data] of Object.entries(calendar)) {
      const totalAvailable = data.totalStock - data.totalBooked;
      let status = 'unknown';
      if (data.totalStock > 0) {
        const availableRate = totalAvailable / data.totalStock;
        if (availableRate > 0.5) status = 'available';
        else if (availableRate > 0.1) status = 'limited';
        else status = 'full';
      }
      
      result[dateStr] = {
        ...data,
        totalAvailable,
        status,
      };
    }
    
    res.json({
      code: 200,
      data: {
        month: month || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
        carConfigs,
        calendar: result,
      }
    });
  } catch (err) {
    console.error('Error fetching car calendar:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/calendar/detail - 获取某日期的详细库存信息
app.get('/api/calendar/detail', verifyAdmin, async (req, res) => {
  try {
    const { date, type } = req.query; // type: 'rooms' | 'cars'
    
    if (!date) {
      return res.status(400).json({ code: 400, msg: '请提供日期参数' });
    }
    
    const queryDate = new Date(date);
    
    if (type === 'rooms' || !type) {
      // 获取房间库存详情
      const stocks = await prisma.houseStock.findMany({
        where: { date: queryDate },
        include: { house: true },
      });
      
      const bookings = await prisma.order.findMany({
        where: {
          type: 'homestay',
          checkIn: { lte: queryDate },
          checkOut: { gt: queryDate },
          status: { in: ['confirmed', 'pending'] },
        },
        include: { user: true, house: true },
      });
      
      const rooms = stocks.map(s => ({
        id: s.houseId,
        title: s.house?.title || '未知',
        total: s.totalStock,
        booked: s.bookedStock,
        available: s.totalStock - s.bookedStock,
        price: s.price || s.house?.price || 0,
        status: s.bookedStock >= s.totalStock ? 'full' : s.totalStock - s.bookedStock <= 1 ? 'limited' : 'available',
      }));
      
      res.json({
        code: 200,
        data: {
          date,
          type: 'rooms',
          rooms,
          bookings: bookings.map(b => ({
            id: b.orderId,
            guestName: b.user?.username || b.guestName || '未知',
            guestPhone: b.user?.phone || b.guestPhone || '-',
            homestayTitle: b.house?.title || b.itemName,
            checkIn: b.checkIn?.toISOString().split('T')[0],
            checkOut: b.checkOut?.toISOString().split('T')[0],
            status: b.status,
            totalPrice: b.totalPrice,
          })),
        }
      });
    } else if (type === 'cars') {
      // 获取车辆库存详情
      const stocks = await prisma.carStock.findMany({
        where: { date: queryDate },
        include: { carConfig: true },
      });
      
      const rentals = await prisma.carRental.findMany({
        where: {
          startTime: { lte: queryDate },
          endTime: { gt: queryDate },
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
        include: { carConfig: true, driver: true },
      });
      
      const cars = stocks.map(s => ({
        id: s.carConfigId,
        name: s.carConfig?.name || '未知',
        carType: s.carConfig?.carType || '未知',
        hasDriver: s.carConfig?.hasDriver || false,
        total: s.totalStock,
        booked: s.bookedStock,
        available: s.totalStock - s.bookedStock,
        price: s.price || s.carConfig?.price || 0,
        status: s.bookedStock >= s.totalStock ? 'full' : s.totalStock - s.bookedStock <= 1 ? 'limited' : 'available',
      }));
      
      res.json({
        code: 200,
        data: {
          date,
          type: 'cars',
          cars,
          rentals: rentals.map(r => ({
            id: r.id,
            roomNumber: r.roomNumber,
            carName: r.carConfig?.name || r.itemName,
            startTime: r.startTime.toISOString(),
            endTime: r.endTime.toISOString(),
            days: r.days,
            needDriver: r.needDriver,
            driverName: r.driver?.name,
            status: r.status,
            totalPrice: r.totalPrice,
          })),
        }
      });
    } else {
      res.status(400).json({ code: 400, msg: '无效的类型参数' });
    }
  } catch (err) {
    console.error('Error fetching calendar detail:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// 免费额度监控 API (F016)
// ============================================

// 默认的服务限额配置
const DEFAULT_LIMITS = [
  { service: 'supabase', resourceType: 'database', limitValue: 500, unit: 'MB', warningThreshold: 80, criticalThreshold: 95, description: 'Supabase 数据库存储限制' },
  { service: 'supabase', resourceType: 'bandwidth', limitValue: 5, unit: 'GB', warningThreshold: 80, criticalThreshold: 95, description: 'Supabase 带宽限制' },
  { service: 'supabase', resourceType: 'storage', limitValue: 2, unit: 'GB', warningThreshold: 80, criticalThreshold: 95, description: 'Supabase 文件存储限制' },
  { service: 'netlify', resourceType: 'bandwidth', limitValue: 100, unit: 'GB', warningThreshold: 80, criticalThreshold: 95, description: 'Netlify 带宽限制' },
  { service: 'netlify', resourceType: 'buildMinutes', limitValue: 300, unit: 'minutes', warningThreshold: 80, criticalThreshold: 95, description: 'Netlify 构建时间限制' },
  { service: 'render', resourceType: 'hours', limitValue: 750, unit: 'hours', warningThreshold: 80, criticalThreshold: 95, description: 'Render 运行时间限制' },
];

// 初始化默认限额配置
async function initDefaultLimits() {
  try {
    for (const limit of DEFAULT_LIMITS) {
      const existing = await prisma.usageLimit.findFirst({
        where: { service: limit.service, resourceType: limit.resourceType },
      });
      if (!existing) {
        await prisma.usageLimit.create({ data: limit });
      }
    }
    console.log('Usage limits initialized');
  } catch (err) {
    console.error('Failed to initialize usage limits:', err);
  }
}

// GET /api/usage/limits - 获取所有服务限额配置
app.get('/api/usage/limits', verifyAdmin, async (req, res) => {
  try {
    const limits = await prisma.usageLimit.findMany({
      orderBy: [{ service: 'asc' }, { resourceType: 'asc' }],
    });
    res.json({ code: 200, data: limits });
  } catch (err) {
    console.error('Error fetching usage limits:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/usage/limits/:id - 更新限额配置
app.put('/api/usage/limits/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { limitValue, warningThreshold, criticalThreshold, description } = req.body;
    
    const updated = await prisma.usageLimit.update({
      where: { id },
      data: { limitValue, warningThreshold, criticalThreshold, description },
    });
    
    res.json({ code: 200, data: updated, msg: '限额配置已更新' });
  } catch (err) {
    console.error('Error updating usage limit:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/usage/logs - 获取使用量日志（带分页和筛选）
app.get('/api/usage/logs', verifyAdmin, async (req, res) => {
  try {
    const { service, resourceType, startDate, endDate, page = 1, pageSize = 30 } = req.query;
    
    const where = {};
    if (service) where.service = service;
    if (resourceType) where.resourceType = resourceType;
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) where.recordedAt.lte = new Date(endDate);
    }
    
    const [logs, total] = await Promise.all([
      prisma.usageLog.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
      }),
      prisma.usageLog.count({ where }),
    ]);
    
    res.json({
      code: 200,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize)),
        },
      },
    });
  } catch (err) {
    console.error('Error fetching usage logs:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/usage/logs - 记录使用量（手动或定时任务）
app.post('/api/usage/logs', verifyAdmin, async (req, res) => {
  try {
    const { service, resourceType, usedValue, unit } = req.body;
    
    if (!service || !resourceType || usedValue === undefined) {
      return res.status(400).json({ code: 400, msg: '缺少必要参数' });
    }
    
    // 获取限额配置
    let limit = await prisma.usageLimit.findFirst({
      where: { service, resourceType },
    });
    
    // 如果没有配置，使用默认值
    if (!limit) {
      const defaultLimit = DEFAULT_LIMITS.find(
        l => l.service === service && l.resourceType === resourceType
      );
      if (defaultLimit) {
        limit = await prisma.usageLimit.create({ data: defaultLimit });
      } else {
        return res.status(400).json({ code: 400, msg: '未找到对应的限额配置' });
      }
    }
    
    // 计算使用百分比
    const percentage = (usedValue / limit.limitValue) * 100;
    
    // 判断状态
    let status = 'normal';
    if (percentage >= limit.criticalThreshold) {
      status = 'critical';
    } else if (percentage >= limit.warningThreshold) {
      status = 'warning';
    }
    
    const log = await prisma.usageLog.create({
      data: {
        service,
        resourceType,
        usedValue,
        unit: unit || limit.unit,
        percentage,
        status,
      },
    });
    
    res.json({ code: 200, data: log, msg: '使用量已记录' });
  } catch (err) {
    console.error('Error creating usage log:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/usage/status - 获取当前各服务使用状态（Dashboard用）
app.get('/api/usage/status', verifyAdmin, async (req, res) => {
  try {
    // 获取所有限额配置
    const limits = await prisma.usageLimit.findMany();
    
    // 获取每个服务+资源类型的最新记录
    const statusList = await Promise.all(
      limits.map(async (limit) => {
        const latestLog = await prisma.usageLog.findFirst({
          where: { service: limit.service, resourceType: limit.resourceType },
          orderBy: { recordedAt: 'desc' },
        });
        
        // 获取最近7天的趋势
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const trend = await prisma.usageLog.findMany({
          where: {
            service: limit.service,
            resourceType: limit.resourceType,
            recordedAt: { gte: sevenDaysAgo },
          },
          orderBy: { recordedAt: 'asc' },
          select: { recordedAt: true, usedValue: true, percentage: true },
        });
        
        return {
          id: limit.id,
          service: limit.service,
          resourceType: limit.resourceType,
          limitValue: limit.limitValue,
          unit: limit.unit,
          warningThreshold: limit.warningThreshold,
          criticalThreshold: limit.criticalThreshold,
          description: limit.description,
          current: latestLog ? {
            usedValue: latestLog.usedValue,
            percentage: latestLog.percentage,
            status: latestLog.status,
            recordedAt: latestLog.recordedAt,
          } : {
            usedValue: 0,
            percentage: 0,
            status: 'normal',
            recordedAt: null,
          },
          trend: trend.map(t => ({
            date: t.recordedAt.toISOString().split('T')[0],
            usedValue: t.usedValue,
            percentage: t.percentage,
          })),
        };
      })
    );
    
    // 按服务分组
    const groupedByService = {};
    for (const item of statusList) {
      if (!groupedByService[item.service]) {
        groupedByService[item.service] = [];
      }
      groupedByService[item.service].push(item);
    }
    
    // 计算预警数量
    const warnings = statusList.filter(s => s.current.status === 'warning').length;
    const criticals = statusList.filter(s => s.current.status === 'critical').length;
    
    res.json({
      code: 200,
      data: {
        services: groupedByService,
        summary: {
          total: statusList.length,
          normal: statusList.filter(s => s.current.status === 'normal').length,
          warning: warnings,
          critical: criticals,
          hasAlerts: warnings > 0 || criticals > 0,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching usage status:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/usage/alerts - 获取预警列表
app.get('/api/usage/alerts', verifyAdmin, async (req, res) => {
  try {
    const limits = await prisma.usageLimit.findMany();
    
    const alerts = [];
    for (const limit of limits) {
      const latestLog = await prisma.usageLog.findFirst({
        where: { service: limit.service, resourceType: limit.resourceType },
        orderBy: { recordedAt: 'desc' },
      });
      
      if (latestLog && (latestLog.status === 'warning' || latestLog.status === 'critical')) {
        alerts.push({
          service: limit.service,
          resourceType: limit.resourceType,
          usedValue: latestLog.usedValue,
          limitValue: limit.limitValue,
          unit: limit.unit,
          percentage: latestLog.percentage,
          status: latestLog.status,
          message: `${limit.service} ${limit.resourceType} 使用率已达 ${latestLog.percentage.toFixed(1)}%，超过${latestLog.status === 'critical' ? '严重' : '预警'}阈值`,
          recordedAt: latestLog.recordedAt,
        });
      }
    }
    
    // 按状态和时间排序
    alerts.sort((a, b) => {
      if (a.status === 'critical' && b.status !== 'critical') return -1;
      if (a.status !== 'critical' && b.status === 'critical') return 1;
      return new Date(b.recordedAt) - new Date(a.recordedAt);
    });
    
    res.json({ code: 200, data: alerts });
  } catch (err) {
    console.error('Error fetching usage alerts:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/usage/logs/cleanup - 清理过期的使用量日志（只保留30天）
app.delete('/api/usage/logs/cleanup', verifyAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await prisma.usageLog.deleteMany({
      where: { recordedAt: { lt: thirtyDaysAgo } },
    });
    
    res.json({ 
      code: 200, 
      msg: `已清理 ${result.count} 条过期日志`,
      data: { deletedCount: result.count },
    });
  } catch (err) {
    console.error('Error cleaning up usage logs:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/usage/simulate - 模拟使用量数据（用于测试和演示）
app.post('/api/usage/simulate', verifyAdmin, async (req, res) => {
  try {
    const limits = await prisma.usageLimit.findMany();
    const created = [];
    
    for (const limit of limits) {
      // 生成模拟的当前使用量（30%-90%之间随机）
      const minPercent = 30;
      const maxPercent = 90;
      const randomPercent = minPercent + Math.random() * (maxPercent - minPercent);
      const usedValue = Math.round((randomPercent / 100) * limit.limitValue * 100) / 100;
      
      const percentage = (usedValue / limit.limitValue) * 100;
      let status = 'normal';
      if (percentage >= limit.criticalThreshold) status = 'critical';
      else if (percentage >= limit.warningThreshold) status = 'warning';
      
      const log = await prisma.usageLog.create({
        data: {
          service: limit.service,
          resourceType: limit.resourceType,
          usedValue,
          unit: limit.unit,
          percentage,
          status,
        },
      });
      
      created.push(log);
    }
    
    res.json({ 
      code: 200, 
      msg: `已生成 ${created.length} 条模拟数据`,
      data: created,
    });
  } catch (err) {
    console.error('Error simulating usage data:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================================
// 营销工具 API - 优惠券和促销活动
// ============================================================

// ========== 优惠券 API ==========

// GET /api/coupons - 获取优惠券列表
app.get('/api/coupons', async (req, res) => {
  try {
    const { status, applicableType, page = 1, pageSize = 20 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (applicableType) where.applicableType = applicableType;
    
    const total = await prisma.coupon.count({ where });
    const list = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(pageSize),
      take: parseInt(pageSize),
    });
    
    res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) {
    console.error('Error fetching coupons:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/coupons/:id - 获取优惠券详情
app.get('/api/coupons/:id', async (req, res) => {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: req.params.id },
      include: { userCoupons: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    
    if (!coupon) {
      return res.status(404).json({ code: 404, msg: '优惠券不存在' });
    }
    
    res.json({ code: 200, data: coupon });
  } catch (err) {
    console.error('Error fetching coupon:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/coupons - 创建优惠券
app.post('/api/coupons', verifyAdmin, async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minAmount = 0,
      maxDiscount,
      totalCount = 0,
      perUserLimit = 1,
      startTime,
      endTime,
      applicableType = 'all',
      applicableIds,
    } = req.body;
    
    // 检查优惠券代码是否已存在
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ code: 400, msg: '优惠券代码已存在' });
    }
    
    const coupon = await prisma.coupon.create({
      data: {
        code,
        name,
        description,
        type,
        value,
        minAmount,
        maxDiscount,
        totalCount,
        perUserLimit,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        applicableType,
        applicableIds,
      },
    });
    
    res.json({ code: 200, data: coupon, msg: '优惠券创建成功' });
  } catch (err) {
    console.error('Error creating coupon:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/coupons/:id - 更新优惠券
app.put('/api/coupons/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    if (updateData.startTime) updateData.startTime = new Date(updateData.startTime);
    if (updateData.endTime) updateData.endTime = new Date(updateData.endTime);
    
    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });
    
    res.json({ code: 200, data: coupon, msg: '优惠券更新成功' });
  } catch (err) {
    console.error('Error updating coupon:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/coupons/:id - 删除优惠券
app.delete('/api/coupons/:id', verifyAdmin, async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ code: 200, msg: '优惠券删除成功' });
  } catch (err) {
    console.error('Error deleting coupon:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/coupons/validate - 验证优惠券
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, amount, applicableType, applicableId } = req.body;
    
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    
    if (!coupon) {
      return res.status(400).json({ code: 400, msg: '优惠券不存在' });
    }
    
    // 检查状态
    if (coupon.status !== 'active') {
      return res.status(400).json({ code: 400, msg: '优惠券已失效' });
    }
    
    // 检查有效期
    const now = new Date();
    if (now < coupon.startTime) {
      return res.status(400).json({ code: 400, msg: '优惠券尚未生效' });
    }
    if (now > coupon.endTime) {
      return res.status(400).json({ code: 400, msg: '优惠券已过期' });
    }
    
    // 检查最低消费
    if (amount < coupon.minAmount) {
      return res.status(400).json({ code: 400, msg: `最低消费金额为 ${coupon.minAmount} 泰铢` });
    }
    
    // 检查适用类型
    if (coupon.applicableType !== 'all' && coupon.applicableType !== applicableType) {
      return res.status(400).json({ code: 400, msg: '该优惠券不适用于当前订单类型' });
    }
    
    // 检查适用项目
    if (coupon.applicableIds && applicableId) {
      const ids = coupon.applicableIds.split(',').map(id => id.trim());
      if (!ids.includes(applicableId)) {
        return res.status(400).json({ code: 400, msg: '该优惠券不适用于当前项目' });
      }
    }
    
    // 检查库存
    if (coupon.totalCount > 0 && coupon.usedCount >= coupon.totalCount) {
      return res.status(400).json({ code: 400, msg: '优惠券已被领完' });
    }
    
    // 计算折扣金额
    let discountAmount = 0;
    if (coupon.type === 'cash') {
      discountAmount = coupon.value;
    } else if (coupon.type === 'percent') {
      discountAmount = Math.floor(amount * coupon.value / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'discount') {
      discountAmount = coupon.value;
    }
    
    res.json({
      code: 200,
      data: {
        coupon,
        discountAmount,
        finalAmount: amount - discountAmount,
      },
    });
  } catch (err) {
    console.error('Error validating coupon:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/coupons/use - 使用优惠券
app.post('/api/coupons/use', authMiddleware, async (req, res) => {
  try {
    const { code, orderId, amount } = req.body;
    const userId = req.user.id;
    
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    
    if (!coupon) {
      return res.status(400).json({ code: 400, msg: '优惠券不存在' });
    }
    
    // 检查用户使用次数
    const userUsage = await prisma.userCoupon.count({
      where: { userId, couponId: coupon.id, status: 'used' },
    });
    
    if (userUsage >= coupon.perUserLimit) {
      return res.status(400).json({ code: 400, msg: '您已达到该优惠券的使用上限' });
    }
    
    // 计算折扣金额
    let discountAmount = 0;
    if (coupon.type === 'cash') {
      discountAmount = coupon.value;
    } else if (coupon.type === 'percent') {
      discountAmount = Math.floor(amount * coupon.value / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'discount') {
      discountAmount = coupon.value;
    }
    
    // 创建用户优惠券记录
    await prisma.userCoupon.create({
      data: {
        userId,
        couponId: coupon.id,
        orderId,
        status: 'used',
        usedAt: new Date(),
      },
    });
    
    // 更新优惠券使用次数
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });
    
    res.json({
      code: 200,
      data: {
        discountAmount,
        finalAmount: amount - discountAmount,
      },
      msg: '优惠券使用成功',
    });
  } catch (err) {
    console.error('Error using coupon:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/coupons/user/available - 获取用户可用优惠券
app.get('/api/coupons/user/available', authMiddleware, async (req, res) => {
  try {
    const { amount, applicableType } = req.query;
    const userId = req.user.id;
    
    const now = new Date();
    
    const coupons = await prisma.coupon.findMany({
      where: {
        status: 'active',
        startTime: { lte: now },
        endTime: { gte: now },
        OR: [
          { totalCount: 0 },
          { usedCount: { lt: prisma.coupon.fields.totalCount } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // 筛选符合条件的优惠券
    const availableCoupons = [];
    for (const coupon of coupons) {
      // 检查用户使用次数
      const userUsage = await prisma.userCoupon.count({
        where: { userId, couponId: coupon.id, status: 'used' },
      });
      
      if (userUsage >= coupon.perUserLimit) continue;
      
      // 检查最低消费
      if (amount && parseInt(amount) < coupon.minAmount) continue;
      
      // 检查适用类型
      if (applicableType && coupon.applicableType !== 'all' && coupon.applicableType !== applicableType) continue;
      
      // 计算折扣金额
      let discountAmount = 0;
      if (amount) {
        if (coupon.type === 'cash') {
          discountAmount = coupon.value;
        } else if (coupon.type === 'percent') {
          discountAmount = Math.floor(parseInt(amount) * coupon.value / 100);
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        }
      }
      
      availableCoupons.push({
        ...coupon,
        discountAmount,
        userUsedCount: userUsage,
      });
    }
    
    res.json({ code: 200, data: availableCoupons });
  } catch (err) {
    console.error('Error fetching user available coupons:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ========== 促销活动 API ==========

// GET /api/promotions - 获取促销活动列表
app.get('/api/promotions', async (req, res) => {
  try {
    const { status, applicableType, page = 1, pageSize = 20 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (applicableType) where.applicableType = applicableType;
    
    const total = await prisma.promotion.count({ where });
    const list = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(pageSize),
      take: parseInt(pageSize),
    });
    
    res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) {
    console.error('Error fetching promotions:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/promotions/active - 获取当前有效的促销活动
app.get('/api/promotions/active', async (req, res) => {
  try {
    const { applicableType } = req.query;
    const now = new Date();
    
    const where = {
      status: 'active',
      startTime: { lte: now },
      endTime: { gte: now },
    };
    
    if (applicableType) {
      where.OR = [
        { applicableType: 'all' },
        { applicableType },
      ];
    }
    
    const list = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ code: 200, data: list });
  } catch (err) {
    console.error('Error fetching active promotions:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/promotions/:id - 获取促销活动详情
app.get('/api/promotions/:id', async (req, res) => {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id: req.params.id },
    });
    
    if (!promotion) {
      return res.status(404).json({ code: 404, msg: '促销活动不存在' });
    }
    
    res.json({ code: 200, data: promotion });
  } catch (err) {
    console.error('Error fetching promotion:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/promotions - 创建促销活动
app.post('/api/promotions', verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      discountValue,
      discountType = 'percent',
      applicableType = 'all',
      applicableIds,
      startTime,
      endTime,
      image,
      bannerText,
    } = req.body;
    
    const promotion = await prisma.promotion.create({
      data: {
        name,
        description,
        type,
        discountValue,
        discountType,
        applicableType,
        applicableIds,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        image,
        bannerText,
      },
    });
    
    res.json({ code: 200, data: promotion, msg: '促销活动创建成功' });
  } catch (err) {
    console.error('Error creating promotion:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/promotions/:id - 更新促销活动
app.put('/api/promotions/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    if (updateData.startTime) updateData.startTime = new Date(updateData.startTime);
    if (updateData.endTime) updateData.endTime = new Date(updateData.endTime);
    
    const promotion = await prisma.promotion.update({
      where: { id },
      data: updateData,
    });
    
    res.json({ code: 200, data: promotion, msg: '促销活动更新成功' });
  } catch (err) {
    console.error('Error updating promotion:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/promotions/:id - 删除促销活动
app.delete('/api/promotions/:id', verifyAdmin, async (req, res) => {
  try {
    await prisma.promotion.delete({ where: { id: req.params.id } });
    res.json({ code: 200, msg: '促销活动删除成功' });
  } catch (err) {
    console.error('Error deleting promotion:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/promotions/check/:itemId - 检查项目是否有促销活动
app.get('/api/promotions/check/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { applicableType, amount } = req.query;
    const now = new Date();
    
    const promotions = await prisma.promotion.findMany({
      where: {
        status: 'active',
        startTime: { lte: now },
        endTime: { gte: now },
        OR: [
          { applicableType: 'all' },
          { applicableType },
        ],
      },
    });
    
    // 筛选适用该项目的促销活动
    const applicablePromotions = promotions.filter(p => {
      if (!p.applicableIds) return true;
      const ids = p.applicableIds.split(',').map(id => id.trim());
      return ids.includes(itemId);
    });
    
    // 计算折扣
    const result = applicablePromotions.map(p => {
      let discountAmount = 0;
      if (amount) {
        if (p.discountType === 'percent') {
          discountAmount = Math.floor(parseInt(amount) * p.discountValue / 100);
        } else {
          discountAmount = p.discountValue;
        }
      }
      return {
        ...p,
        discountAmount,
      };
    });
    
    res.json({ code: 200, data: result });
  } catch (err) {
    console.error('Error checking promotions:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// ============================================
// 会员系统 API (F024)
// ============================================

// 获取用户的会员等级（根据累计积分）
const getUserLevel = async (totalPoints) => {
  const levels = await prisma.memberLevel.findMany({
    orderBy: { minPoints: 'asc' },
  });
  
  let currentLevel = levels[0]; // 默认最低等级
  for (const level of levels) {
    if (totalPoints >= level.minPoints) {
      currentLevel = level;
    }
  }
  return currentLevel;
};

// 更新用户会员等级
const updateUserLevel = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalPoints: true },
  });
  
  if (!user) return null;
  
  const level = await getUserLevel(user.totalPoints);
  
  await prisma.user.update({
    where: { id: userId },
    data: { levelId: level.id },
  });
  
  return level;
};

// GET /api/membership/levels - 获取会员等级列表
app.get('/api/membership/levels', async (req, res) => {
  try {
    const levels = await prisma.memberLevel.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    
    res.json({ code: 200, data: levels });
  } catch (err) {
    console.error('Error fetching membership levels:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/membership/my - 获取当前用户会员信息
app.get('/api/membership/my', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        level: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }
    
    // 获取下一等级信息
    const allLevels = await prisma.memberLevel.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    
    let nextLevel = null;
    if (user.level) {
      const currentIndex = allLevels.findIndex(l => l.id === user.levelId);
      if (currentIndex < allLevels.length - 1) {
        nextLevel = allLevels[currentIndex + 1];
      }
    }
    
    res.json({
      code: 200,
      data: {
        points: user.points,
        totalPoints: user.totalPoints,
        level: user.level,
        nextLevel,
        pointsToNextLevel: nextLevel ? nextLevel.minPoints - user.totalPoints : 0,
      },
    });
  } catch (err) {
    console.error('Error fetching membership info:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/membership/points - 获取积分记录
app.get('/api/membership/points', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    
    const where = { userId: req.user.id };
    if (type) where.type = type;
    
    const [logs, total] = await Promise.all([
      prisma.pointLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(pageSize),
      }),
      prisma.pointLog.count({ where }),
    ]);
    
    res.json({
      code: 200,
      data: {
        list: logs,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (err) {
    console.error('Error fetching point logs:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/membership/points/earn - 获得积分（订单完成时调用）
app.post('/api/membership/points/earn', authMiddleware, async (req, res) => {
  try {
    const { points, relatedId, relatedType, remark } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ code: 400, msg: '积分必须大于0' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { level: true },
    });
    
    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }
    
    // 计算实际积分（考虑会员等级积分倍率）
    const pointsRate = user.level?.pointsRate || 1;
    const actualPoints = Math.floor(points * pointsRate);
    
    // 使用事务更新积分和创建记录
    const result = await prisma.$transaction(async (tx) => {
      // 更新用户积分
      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: {
          points: { increment: actualPoints },
          totalPoints: { increment: actualPoints },
        },
      });
      
      // 创建积分记录
      const log = await tx.pointLog.create({
        data: {
          userId: req.user.id,
          points: actualPoints,
          balance: updatedUser.points,
          type: 'earn_order',
          relatedId,
          relatedType,
          remark: remark || `订单获得积分（倍率: ${pointsRate}x）`,
        },
      });
      
      return { user: updatedUser, log };
    });
    
    // 更新会员等级
    const newLevel = await updateUserLevel(req.user.id);
    
    res.json({
      code: 200,
      data: {
        points: actualPoints,
        balance: result.user.points,
        totalPoints: result.user.totalPoints,
        levelUp: newLevel?.id !== user.levelId,
        newLevel,
      },
      msg: `成功获得 ${actualPoints} 积分`,
    });
  } catch (err) {
    console.error('Error earning points:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/membership/points/consume - 消费积分
app.post('/api/membership/points/consume', authMiddleware, async (req, res) => {
  try {
    const { points, relatedId, relatedType, remark } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ code: 400, msg: '积分必须大于0' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    
    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }
    
    if (user.points < points) {
      return res.status(400).json({ code: 400, msg: '积分不足' });
    }
    
    // 使用事务更新积分和创建记录
    const result = await prisma.$transaction(async (tx) => {
      // 更新用户积分
      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: {
          points: { decrement: points },
        },
      });
      
      // 创建积分记录
      const log = await tx.pointLog.create({
        data: {
          userId: req.user.id,
          points: -points, // 负数表示消费
          balance: updatedUser.points,
          type: 'consume',
          relatedId,
          relatedType,
          remark,
        },
      });
      
      return { user: updatedUser, log };
    });
    
    res.json({
      code: 200,
      data: {
        points: -points,
        balance: result.user.points,
      },
      msg: `成功消费 ${points} 积分`,
    });
  } catch (err) {
    console.error('Error consuming points:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/membership/points/admin-adjust - 管理员调整积分
app.post('/api/membership/points/admin-adjust', verifyAdmin, async (req, res) => {
  try {
    const { userId, points, remark } = req.body;
    
    if (!userId || !points) {
      return res.status(400).json({ code: 400, msg: '缺少必要参数' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }
    
    // 使用事务更新积分和创建记录
    const result = await prisma.$transaction(async (tx) => {
      const updateData = {
        points: points > 0 ? { increment: points } : { decrement: Math.abs(points) },
      };
      
      // 如果是增加积分，也增加累计积分
      if (points > 0) {
        updateData.totalPoints = { increment: points };
      }
      
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: updateData,
      });
      
      const log = await tx.pointLog.create({
        data: {
          userId,
          points,
          balance: updatedUser.points,
          type: 'admin',
          remark: remark || '管理员调整',
        },
      });
      
      return { user: updatedUser, log };
    });
    
    // 更新会员等级
    await updateUserLevel(userId);
    
    res.json({
      code: 200,
      data: result,
      msg: `成功调整 ${points > 0 ? '+' : ''}${points} 积分`,
    });
  } catch (err) {
    console.error('Error adjusting points:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/admin/membership/levels - 管理员获取等级列表
app.get('/api/admin/membership/levels', verifyAdmin, async (req, res) => {
  try {
    const levels = await prisma.memberLevel.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    
    // 获取每个等级的用户数量
    const levelsWithCount = await Promise.all(
      levels.map(async (level) => {
        const count = await prisma.user.count({
          where: { levelId: level.id },
        });
        return { ...level, userCount: count };
      })
    );
    
    res.json({ code: 200, data: levelsWithCount });
  } catch (err) {
    console.error('Error fetching admin membership levels:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/admin/membership/levels/:id - 管理员更新等级配置
app.put('/api/admin/membership/levels/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // 处理 benefits 字段
    if (updateData.benefits && Array.isArray(updateData.benefits)) {
      updateData.benefits = JSON.stringify(updateData.benefits);
    }
    
    const level = await prisma.memberLevel.update({
      where: { id },
      data: updateData,
    });
    
    res.json({ code: 200, data: level, msg: '等级配置更新成功' });
  } catch (err) {
    console.error('Error updating membership level:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/admin/membership/levels - 管理员创建等级
app.post('/api/admin/membership/levels', verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      nameEn,
      minPoints,
      maxPoints,
      discount,
      pointsRate,
      icon,
      color,
      benefits,
      sortOrder,
    } = req.body;
    
    const level = await prisma.memberLevel.create({
      data: {
        name,
        nameEn,
        minPoints,
        maxPoints,
        discount: discount || 0,
        pointsRate: pointsRate || 1,
        icon,
        color,
        benefits: benefits ? JSON.stringify(benefits) : null,
        sortOrder: sortOrder || 0,
      },
    });
    
    res.json({ code: 200, data: level, msg: '等级创建成功' });
  } catch (err) {
    console.error('Error creating membership level:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// DELETE /api/admin/membership/levels/:id - 管理员删除等级
app.delete('/api/admin/membership/levels/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否有用户使用该等级
    const userCount = await prisma.user.count({
      where: { levelId: id },
    });
    
    if (userCount > 0) {
      return res.status(400).json({ 
        code: 400, 
        msg: `无法删除，有 ${userCount} 个用户正在使用该等级` 
      });
    }
    
    await prisma.memberLevel.delete({ where: { id } });
    
    res.json({ code: 200, msg: '等级删除成功' });
  } catch (err) {
    console.error('Error deleting membership level:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/admin/membership/users - 管理员获取会员列表
app.get('/api/admin/membership/users', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, levelId, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    
    const where = {};
    if (levelId) where.levelId = levelId;
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { level: true },
        orderBy: { totalPoints: 'desc' },
        skip,
        take: parseInt(pageSize),
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          points: true,
          totalPoints: true,
          level: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);
    
    res.json({
      code: 200,
      data: {
        list: users,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (err) {
    console.error('Error fetching membership users:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// 订单完成时自动获得积分的辅助函数
const earnPointsForOrder = async (userId, orderAmount, orderId) => {
  try {
    // 每消费1元获得1积分（基础），会员等级会乘以倍率
    const basePoints = Math.floor(orderAmount);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { level: true },
    });
    
    if (!user) return null;
    
    const pointsRate = user.level?.pointsRate || 1;
    const actualPoints = Math.floor(basePoints * pointsRate);
    
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          points: { increment: actualPoints },
          totalPoints: { increment: actualPoints },
        },
      });
      
      const log = await tx.pointLog.create({
        data: {
          userId,
          points: actualPoints,
          balance: updatedUser.points,
          type: 'earn_order',
          relatedId: orderId,
          relatedType: 'order',
          remark: `订单完成获得积分（倍率: ${pointsRate}x）`,
        },
      });
      
      return { user: updatedUser, log };
    });
    
    // 更新会员等级
    await updateUserLevel(userId);
    
    return result;
  } catch (err) {
    console.error('Error earning points for order:', err);
    return null;
  }
};

// ============================================
// 商家入驻 API (F023)
// ============================================

// POST /api/merchants/apply - 申请入驻
app.post('/api/merchants/apply', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, description, bankName, bankAccount } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ code: 400, msg: '商家名称和联系电话为必填项' });
    }
    
    // 检查用户是否已经是商家
    const existingMerchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id },
    });
    
    if (existingMerchant) {
      return res.status(400).json({ code: 400, msg: '您已经申请过商家入驻' });
    }
    
    const merchant = await prisma.merchant.create({
      data: {
        userId: req.user.id,
        name,
        phone,
        email,
        description,
        bankName,
        bankAccount,
        status: 'pending',
      },
    });
    
    res.json({ code: 200, data: merchant, msg: '商家入驻申请已提交，请等待审核' });
  } catch (err) {
    console.error('Error applying merchant:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/merchants/my - 获取我的商家信息
app.get('/api/merchants/my', authMiddleware, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id },
      include: {
        products: {
          where: { status: 'active' },
        },
      },
    });
    
    if (!merchant) {
      return res.status(404).json({ code: 404, msg: '您还不是商家' });
    }
    
    res.json({ code: 200, data: merchant });
  } catch (err) {
    console.error('Error fetching merchant:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/merchants/my - 更新商家信息
app.put('/api/merchants/my', authMiddleware, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id },
    });
    
    if (!merchant) {
      return res.status(404).json({ code: 404, msg: '商家不存在' });
    }
    
    const updateData = { ...req.body };
    delete updateData.status; // 不允许用户自己修改状态
    delete updateData.commission; // 不允许用户自己修改佣金
    
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchant.id },
      data: updateData,
    });
    
    res.json({ code: 200, data: updatedMerchant, msg: '商家信息更新成功' });
  } catch (err) {
    console.error('Error updating merchant:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/admin/merchants - 管理员获取商家列表
app.get('/api/admin/merchants', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(pageSize),
      }),
      prisma.merchant.count({ where }),
    ]);
    
    res.json({
      code: 200,
      data: {
        list: merchants,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (err) {
    console.error('Error fetching merchants:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/admin/merchants/:id - 管理员获取商家详情
app.get('/api/admin/merchants/:id', verifyAdmin, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.params.id },
      include: {
        products: true,
      },
    });
    
    if (!merchant) {
      return res.status(404).json({ code: 404, msg: '商家不存在' });
    }
    
    res.json({ code: 200, data: merchant });
  } catch (err) {
    console.error('Error fetching merchant:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/admin/merchants/:id/approve - 管理员审核通过
app.put('/api/admin/merchants/:id/approve', verifyAdmin, async (req, res) => {
  try {
    const { commission } = req.body;
    
    const merchant = await prisma.merchant.update({
      where: { id: req.params.id },
      data: {
        status: 'approved',
        commission: commission || 10,
      },
    });
    
    res.json({ code: 200, data: merchant, msg: '商家审核通过' });
  } catch (err) {
    console.error('Error approving merchant:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/admin/merchants/:id/reject - 管理员审核拒绝
app.put('/api/admin/merchants/:id/reject', verifyAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const merchant = await prisma.merchant.update({
      where: { id: req.params.id },
      data: {
        status: 'rejected',
        rejectReason: reason,
      },
    });
    
    res.json({ code: 200, data: merchant, msg: '商家审核已拒绝' });
  } catch (err) {
    console.error('Error rejecting merchant:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/admin/merchants/:id/suspend - 管理员暂停商家
app.put('/api/admin/merchants/:id/suspend', verifyAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const merchant = await prisma.merchant.update({
      where: { id: req.params.id },
      data: {
        status: 'suspended',
        remark: reason,
      },
    });
    
    res.json({ code: 200, data: merchant, msg: '商家已暂停' });
  } catch (err) {
    console.error('Error suspending merchant:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/admin/merchants/:id/restore - 管理员恢复商家
app.put('/api/admin/merchants/:id/restore', verifyAdmin, async (req, res) => {
  try {
    const merchant = await prisma.merchant.update({
      where: { id: req.params.id },
      data: {
        status: 'approved',
      },
    });
    
    res.json({ code: 200, data: merchant, msg: '商家已恢复' });
  } catch (err) {
    console.error('Error restoring merchant:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// PUT /api/admin/merchants/:id - 管理员更新商家信息
app.put('/api/admin/merchants/:id', verifyAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    const merchant = await prisma.merchant.update({
      where: { id: req.params.id },
      data: updateData,
    });
    
    res.json({ code: 200, data: merchant, msg: '商家信息更新成功' });
  } catch (err) {
    console.error('Error updating merchant:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// GET /api/admin/merchants/stats/overview - 商家统计概览
app.get('/api/admin/merchants/stats/overview', verifyAdmin, async (req, res) => {
  try {
    const [total, pending, approved, rejected, suspended] = await Promise.all([
      prisma.merchant.count(),
      prisma.merchant.count({ where: { status: 'pending' } }),
      prisma.merchant.count({ where: { status: 'approved' } }),
      prisma.merchant.count({ where: { status: 'rejected' } }),
      prisma.merchant.count({ where: { status: 'suspended' } }),
    ]);
    
    res.json({
      code: 200,
      data: {
        total,
        pending,
        approved,
        rejected,
        suspended,
      },
    });
  } catch (err) {
    console.error('Error fetching merchant stats:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // 在服务器启动后初始化默认数据（不阻塞服务器）
  initDefaultLimits();
});

module.exports = app;
