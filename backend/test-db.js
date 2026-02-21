const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('连接成功！');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('查询结果:', result);
  } catch (e) {
    console.error('连接失败:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();