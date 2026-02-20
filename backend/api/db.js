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

// Homestays
app.get('/api/homestays', async (req, res) => {
  try {
    const cacheKey = 'homestays:all';
    const fromCache = cache.get(cacheKey);
    if (fromCache) {
      return res.json(fromCache);
    }

    const homestays = await prisma.homestay.findMany({
      include: {
        stocks: true,
      },
    });
    
    // Transform to match frontend format
    const formatted = homestays.map(h => ({
      id: h.id,
      title: h.title,
      location: h.location,
      price: h.price,
      rating: h.rating,
      reviews: h.reviews,
      images: h.images,
      type: h.type,
      guests: h.guests,
      bedrooms: h.bedrooms,
      beds: h.beds,
      bathrooms: h.bathrooms,
      amenities: h.amenities,
      description: h.description,
      isFavorite: h.isFavorite,
      host: {
        name: h.hostName,
        avatar: h.hostAvatar,
        isSuperhost: h.isSuperhost,
      },
    }));

    const payload = { code: 200, data: formatted };
    cache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    console.error('Error fetching homestays:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/homestays/:id', async (req, res) => {
  try {
    const homestay = await prisma.homestay.findUnique({
      where: { id: req.params.id },
      include: { stocks: true },
    });
    
    if (!homestay) {
      return res.status(404).json({ code: 404, msg: 'Not found' });
    }
    
    res.json({
      code: 200,
      data: {
        id: homestay.id,
        title: homestay.title,
        location: homestay.location,
        price: homestay.price,
        rating: homestay.rating,
        reviews: homestay.reviews,
        images: homestay.images,
        type: homestay.type,
        guests: homestay.guests,
        bedrooms: homestay.bedrooms,
        beds: homestay.beds,
        bathrooms: homestay.bathrooms,
        amenities: homestay.amenities,
        description: homestay.description,
        isFavorite: homestay.isFavorite,
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

app.post('/api/homestays', async (req, res) => {
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

app.put('/api/homestays/:id', async (req, res) => {
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

app.delete('/api/homestays/:id', async (req, res) => {
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
app.get('/api/users', async (req, res) => {
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

app.get('/api/users/:id', async (req, res) => {
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

app.put('/api/users/:id', async (req, res) => {
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
app.get('/api/orders', async (req, res) => {
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

app.get('/api/orders/:id', async (req, res) => {
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

app.put('/api/orders/:id/status', async (req, res) => {
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

// Finance
app.get('/api/finance/overview', async (req, res) => {
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

app.get('/api/finance/transactions', async (req, res) => {
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
    
    // 使用事务处理预订和库存
    const result = await prisma.$transaction(async (tx) => {
      // 检查并锁定库存
      for (const date of dates) {
        const stock = await tx.houseStock.findUnique({
          where: { houseId_date: { houseId: homestayId, date } },
        });
        
        if (!stock || stock.stockCount < 1) {
          throw new Error(`日期 ${date.toISOString().split('T')[0]} 无可用房源`);
        }
      }
      
      // 扣减库存
      for (const date of dates) {
        await tx.houseStock.update({
          where: { houseId_date: { houseId: homestayId, date } },
          data: { stockCount: { decrement: 1 } },
        });
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
    });
    
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
      
      // 释放库存
      if (order.checkIn && order.checkOut) {
        const dates = getDatesInRange(order.checkIn, order.checkOut);
        for (const date of dates) {
          await tx.houseStock.update({
            where: { houseId_date: { houseId: order.houseId, date } },
            data: { stockCount: { increment: 1 } },
          });
        }
      }
    });
    
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
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ code: 400, msg: '请提供开始和结束日期' });
    }
    
    const stocks = await prisma.houseStock.findMany({
      where: {
        houseId: req.params.id,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });
    
    const formatted = stocks.map(s => ({
      date: s.date.toISOString().split('T')[0],
      stockCount: s.stockCount,
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// POST /api/homestays/:id/init-stock - 初始化库存（管理员）
app.post('/api/homestays/:id/init-stock', verifyAdmin, async (req, res) => {
  try {
    const { stockCount, days } = req.body;
    
    if (!stockCount || stockCount < 1) {
      return res.status(400).json({ code: 400, msg: '库存数量必须大于0' });
    }
    
    // 默认初始化未来90天的库存
    const targetDays = days || 90;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stocks = [];
    for (let i = 0; i < targetDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      stocks.push({
        houseId: req.params.id,
        date,
        stockCount,
      });
    }
    
    // 批量创建或更新库存
    const result = await prisma.houseStock.createMany({
      data: stocks,
      skipDuplicates: true,
    });
    
    // 清除缓存
    cache.del('homestays:all');
    
    res.json({ 
      code: 200, 
      msg: `成功初始化 ${result.count} 天的库存`,
      data: { count: result.count }
    });
  } catch (err) {
    console.error('Error initializing stock:', err);
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
