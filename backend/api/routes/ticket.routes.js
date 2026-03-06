const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { verifyAdmin, authMiddleware } = require('../middleware/auth.middleware');

// ============================================
// Ticket Config APIs (票务配置)
// ============================================

// GET /api/ticket-configs - 获取票务配置列表
router.get('/ticket-configs', async (req, res) => {
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
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// POST /api/ticket-configs - 创建票务配置 (管理员)
router.post('/ticket-configs', verifyAdmin, async (req, res) => {
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
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// PUT /api/ticket-configs/:id - 更新票务配置 (管理员)
router.put('/ticket-configs/:id', verifyAdmin, async (req, res) => {
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
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// DELETE /api/ticket-configs/:id - 删除票务配置 (管理员)
router.delete('/ticket-configs/:id', verifyAdmin, async (req, res) => {
  try {
    await prisma.ticketConfig.delete({
      where: { id: req.params.id },
    });
    
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    console.error('Error deleting ticket config:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ============================================
// Ticket Orders (票务订单)
// ============================================

// POST /api/tickets - 创建票务订单
router.post('/tickets', async (req, res) => {
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
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// GET /api/tickets - 获取票务订单列表
router.get('/tickets', async (req, res) => {
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
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// GET /api/tickets/:id - 获取单个票务订单
router.get('/tickets/:id', async (req, res) => {
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
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// POST /api/tickets/:id/cancel - 取消票务订单
router.post('/tickets/:id/cancel', async (req, res) => {
  try {
    const ticketOrder = await prisma.ticketOrder.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    
    res.json({ code: 200, msg: 'success', data: ticketOrder });
  } catch (err) {
    console.error('Error cancelling ticket order:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// PUT /api/tickets/:id/status - 更新票务订单状态 (管理员)
router.put('/tickets/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const ticketOrder = await prisma.ticketOrder.update({
      where: { id: req.params.id },
      data: { status },
    });
    
    res.json({ code: 200, msg: 'success', data: ticketOrder });
  } catch (err) {
    console.error('Error updating ticket order status:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

module.exports = router;