const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';
const JWT_EXPIRES_IN = '24h';

/** 生成 JWT Token */
const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

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

/** 验证管理员权限的中间件 */
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

module.exports = {
  JWT_SECRET,
  generateToken,
  authMiddleware,
  verifyAdmin
};
