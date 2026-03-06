const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { verifyAdmin, authMiddleware } = require('../middleware/auth.middleware');

// GET /api/orders - List all orders (admin only)
router.get('/', verifyAdmin, async (req, res) => {
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
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// GET /api/orders/:id - Get order by ID (admin only)
router.get('/:id', verifyAdmin, async (req, res) => {
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
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

module.exports = router;
