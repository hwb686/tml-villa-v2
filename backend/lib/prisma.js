const { PrismaClient } = require('@prisma/client');

// When using serverless platforms or nodemon in development we may end up
// creating multiple PrismaClient instances which exhaust the connection pool.
// Store the client on the global object so it is reused across reloads.

let prisma;
if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
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
