const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { authMiddleware, verifyAdmin } = require('../middleware/auth.middleware');

// GET /api/users - List all users (admin only)
router.get('/', verifyAdmin, async (req, res) => {
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
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({ code: 404, msg: 'Not found' });
    }

    delete user.password;
    res.json({ code: 200, data: user });
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { username, phone, avatar } = req.body;
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
    });

    delete user.password;
    res.json({ code: 200, data: user });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

module.exports = router;
