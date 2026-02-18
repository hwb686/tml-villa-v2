// Simple in-memory cache with a TTL
// export an instance of node-cache so we can reuse it in route handlers

const NodeCache = require('node-cache');

// default TTL can be overridden via env var; free Render instances should keep it short
const ttl = parseInt(process.env.CACHE_TTL_SECONDS, 10) || 30;

const cache = new NodeCache({ stdTTL: ttl, checkperiod: ttl * 0.2 });

module.exports = cache;
