const { PrismaClient } = require('@prisma/client');

// When using serverless platforms or nodemon in development we may end up
// creating multiple PrismaClient instances which exhaust the connection pool.
// Store the client on the global object so it is reused across reloads.

let prisma;
if (!global.prisma) {
  // Build connection URL with pgbouncer=true for Supabase compatibility
  // https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting
  const baseUrl = process.env.DATABASE_URL || '';
  const separator = baseUrl.includes('?') ? '&' : '?';
  const connectionUrl = baseUrl.includes('pgbouncer=true')
    ? baseUrl
    : `${baseUrl}${separator}pgbouncer=true&connection_limit=1`;

  global.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    // Supabase 免费版最多 60 连接，Render 512MB RAM 限制
    // connection_limit=1 for serverless environments to prevent connection exhaustion
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  });
}
prisma = global.prisma;

module.exports = prisma;
