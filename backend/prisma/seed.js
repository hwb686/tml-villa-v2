const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123', // Default admin password
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

  // Create default member levels
  const defaultMemberLevels = [
    {
      name: '普通会员',
      nameEn: 'Regular Member',
      minPoints: 0,
      maxPoints: 999,
      discount: 0,
      pointsRate: 1,
      icon: '🥉',
      color: '#CD7F32',
      benefits: JSON.stringify(['基础会员权益', '积分累计']),
      sortOrder: 1,
    },
    {
      name: '银卡会员',
      nameEn: 'Silver Member',
      minPoints: 1000,
      maxPoints: 4999,
      discount: 3,
      pointsRate: 1.2,
      icon: '🥈',
      color: '#C0C0C0',
      benefits: JSON.stringify(['95折优惠', '1.2倍积分', '优先客服']),
      sortOrder: 2,
    },
    {
      name: '金卡会员',
      nameEn: 'Gold Member',
      minPoints: 5000,
      maxPoints: 19999,
      discount: 5,
      pointsRate: 1.5,
      icon: '🥇',
      color: '#FFD700',
      benefits: JSON.stringify(['95折优惠', '1.5倍积分', '专属客服', '生日礼遇']),
      sortOrder: 3,
    },
    {
      name: '钻石会员',
      nameEn: 'Diamond Member',
      minPoints: 20000,
      maxPoints: 999999,
      discount: 10,
      pointsRate: 2,
      icon: '💎',
      color: '#B9F2FF',
      benefits: JSON.stringify(['9折优惠', '2倍积分', '专属客服', '生日礼遇', '免费升级', '专属活动']),
      sortOrder: 4,
    },
  ];

  for (const level of defaultMemberLevels) {
    const result = await prisma.memberLevel.upsert({
      where: { minPoints: level.minPoints },
      update: level,
      create: level,
    });
    console.log('Member level created/updated:', result.name);
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
