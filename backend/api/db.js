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
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('Error logging in:', err);
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
