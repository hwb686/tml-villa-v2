const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: '11345', // Plain text as requested
      name: 'Administrator',
    },
  });
  
  console.log('Admin user created:', admin.username);

  // Create default business configs
  const defaultConfigs = [
    { key: 'homestay.manual_confirm', value: 'true', description: '民宿订单是否需要人工确认' },
    { key: 'car.manual_confirm', value: 'true', description: '租车订单是否需要人工确认' },
    { key: 'meal.manual_confirm', value: 'false', description: '餐饮订单是否需要人工确认' },
    { key: 'ticket.manual_confirm', value: 'false', description: '票务订单是否需要人工确认' },
  ];

  for (const config of defaultConfigs) {
    const result = await prisma.businessConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    });
    console.log('Business config created/updated:', result.key, '=', result.value);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
