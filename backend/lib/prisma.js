const { PrismaClient } = require('@prisma/client');

// When using serverless platforms or nodemon in development we may end up
// creating multiple PrismaClient instances which exhaust the connection pool.
// Store the client on the global object so it is reused across reloads.

let prisma;
if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    // Supabase 免费版最多 60 连接，Render 512MB RAM 限制
    // 保持连接池小巧避免 OOM 和连接耗尽
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Disable prepared statements for Supabase connection pool compatibility
    // https://www.prisma.io/docs/orm/more/problems-and-issues/supabase-connection-pool
    __internal: {
      engine: {
        preparedStatements: false,
      },
    },
  });
}
prisma = global.prisma;

module.exports = prisma;
