const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../../lib/prisma');
const { generateToken, authMiddleware } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const hashPassword = async (plain) => bcrypt.hash(plain, 10);

const checkPassword = async (plain, stored) => {
  if (!stored || !stored.startsWith('$2')) {
    return false;
  }
  return bcrypt.compare(plain, stored);
};

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ code: 400, msg: '邮箱和密码为必填项' });
    }

    if (password.length < 6) {
      return res.status(400).json({ code: 400, msg: '密码长度不能少于6位' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ code: 400, msg: '该邮箱已被注册' });
    }

    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({ code: 400, msg: '该用户名已被使用' });
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: username || email.split('@')[0],
        email,
        password: hashedPassword,
        phone: phone || null,
        role: 'USER',
        status: 'active',
      },
    });

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
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
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
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    res.json({
      code: 200,
      msg: '登出成功',
    });
  } catch (err) {
    console.error('Error logging out:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
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
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Error getting user info:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

module.exports = router;
