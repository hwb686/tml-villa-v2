const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma');
const { verifyAdmin, authMiddleware } = require('../middleware/auth.middleware');

// ============================================
// Car Config APIs (车辆配置)
// ============================================

// GET /api/car-configs - 获取车辆配置列表
router.get('/car-configs', async (req, res) => {
  try {
    const { carType, isActive } = req.query;
    const where = {};
    if (carType) where.carType = carType;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const configs = await prisma.carConfig.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    
    res.json({ code: 200, data: configs });
  } catch (err) {
    console.error('Error fetching car configs:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// POST /api/car-configs - 创建车辆配置 (admin)
router.post('/car-configs', verifyAdmin, async (req, res) => {
  try {
    const { name, description, image, price, carType, seats, sortOrder } = req.body;
    
    const config = await prisma.carConfig.create({
      data: {
        name,
        description,
        image,
        price: parseInt(price),
        carType,
        seats: parseInt(seats) || 5,
        sortOrder: sortOrder || 0,
      },
    });
    
    res.json({ code: 200, msg: 'success', data: config });
  } catch (err) {
    console.error('Error creating car config:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// PUT /api/car-configs/:id - 更新车辆配置 (admin)
router.put('/car-configs/:id', verifyAdmin, async (req, res) => {
  try {
    const { name, description, image, price, carType, seats, isActive, sortOrder } = req.body;
    
    const config = await prisma.carConfig.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        image,
        price: price ? parseInt(price) : undefined,
        carType,
        seats: seats ? parseInt(seats) : undefined,
        isActive,
        sortOrder,
      },
    });
    
    res.json({ code: 200, msg: 'success', data: config });
  } catch (err) {
    console.error('Error updating car config:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// DELETE /api/car-configs/:id - 删除车辆配置 (admin)
router.delete('/car-configs/:id', verifyAdmin, async (req, res) => {
  try {
    await prisma.carConfig.delete({
      where: { id: req.params.id },
    });
    
    res.json({ code: 200, msg: 'success' });
  } catch (err) {
    console.error('Error deleting car config:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ============================================
// Car Stock APIs (车辆库存管理)
// ============================================

// GET /api/car-configs/:id/stock - 获取车辆库存信息
router.get('/car-configs/:id/stock', async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;
    
    let queryStartDate, queryEndDate;
    
    if (month) {
      const [year, mon] = month.split('-').map(Number);
      queryStartDate = new Date(year, mon - 1, 1);
      queryEndDate = new Date(year, mon, 0);
    } else if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      return res.status(400).json({ code: 400, msg: '请提供 month 或 startDate/endDate 参数' });
    }
    
    const stocks = await prisma.carStock.findMany({
      where: {
        carConfigId: req.params.id,
        date: {
          gte: queryStartDate,
          lte: queryEndDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    
    const data = {};
    for (const s of stocks) {
      const dateStr = s.date.toISOString().split('T')[0];
      data[dateStr] = {
        total: s.totalStock,
        booked: s.bookedStock,
        available: s.totalStock - s.bookedStock,
        price: s.price,
      };
    }
    
    res.json({ code: 200, data });
  } catch (err) {
    console.error('Error fetching car stock:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// POST /api/car-configs/:id/init-stock - 初始化车辆库存（管理员）
router.post('/car-configs/:id/init-stock', verifyAdmin, async (req, res) => {
  try {
    const { totalStock, startDate, endDate, price } = req.body;
    
    if (!totalStock || totalStock < 1) {
      return res.status(400).json({ code: 400, msg: '库存数量必须大于0' });
    }
    
    let queryStartDate, queryEndDate;
    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      queryStartDate = new Date();
      queryStartDate.setHours(0, 0, 0, 0);
      queryEndDate = new Date(queryStartDate);
      queryEndDate.setDate(queryEndDate.getDate() + 90);
    }
    
    const stocks = [];
    const current = new Date(queryStartDate);
    while (current <= queryEndDate) {
      stocks.push({
        carConfigId: req.params.id,
        date: new Date(current),
        totalStock,
        bookedStock: 0,
        price: price || null,
      });
      current.setDate(current.getDate() + 1);
    }
    
    let count = 0;
    for (const stock of stocks) {
      await prisma.carStock.upsert({
        where: { carConfigId_date: { carConfigId: stock.carConfigId, date: stock.date } },
        update: { totalStock: stock.totalStock, price: stock.price },
        create: stock,
      });
      count++;
    }
    
    res.json({ 
      code: 200, 
      msg: `成功初始化 ${count} 天的库存`,
      data: { count }
    });
  } catch (err) {
    console.error('Error initializing car stock:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// PUT /api/car-configs/:id/stock/:date - 调整单日库存（管理员）
router.put('/car-configs/:id/stock/:date', verifyAdmin, async (req, res) => {
  try {
    const { totalStock, price } = req.body;
    const date = new Date(req.params.date);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ code: 400, msg: '无效的日期格式' });
    }
    
    let stock = await prisma.carStock.findUnique({
      where: { carConfigId_date: { carConfigId: req.params.id, date } },
    });
    
    if (stock) {
      const updateData = {};
      if (totalStock !== undefined) {
        if (totalStock < stock.bookedStock) {
          return res.status(400).json({ 
            code: 400, 
            msg: `库存不能少于已预订数量 ${stock.bookedStock}` 
          });
        }
        updateData.totalStock = totalStock;
      }
      if (price !== undefined) {
        updateData.price = price;
      }
      
      stock = await prisma.carStock.update({
        where: { carConfigId_date: { carConfigId: req.params.id, date } },
        data: updateData,
      });
    } else {
      stock = await prisma.carStock.create({
        data: {
          carConfigId: req.params.id,
          date,
          totalStock: totalStock || 0,
          bookedStock: 0,
          price: price || null,
        },
      });
    }
    
    res.json({ 
      code: 200, 
      msg: 'success', 
      data: {
        total: stock.totalStock,
        booked: stock.bookedStock,
        available: stock.totalStock - stock.bookedStock,
        price: stock.price,
      }
    });
  } catch (err) {
    console.error('Error updating car stock:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// ============================================
// Car Rentals (租车订单)
// ============================================

// POST /api/car-rentals - 创建租车订单
router.post('/car-rentals', async (req, res) => {
  try {
    const { roomNumber, carConfigId, startTime, endTime, days, remark } = req.body;
    
    // Validate car config exists
    const carConfig = await prisma.carConfig.findUnique({
      where: { id: carConfigId },
    });
    
    if (!carConfig) {
      return res.status(400).json({ code: 400, msg: '车辆不存在' });
    }
    
    if (!carConfig.isActive) {
      return res.status(400).json({ code: 400, msg: '该车辆已下架' });
    }
    
    const totalPrice = carConfig.price * parseInt(days);
    
    const carRental = await prisma.carRental.create({
      data: {
        roomNumber,
        carConfigId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        days: parseInt(days),
        totalPrice,
        remark: remark || '',
        status: 'PENDING',
      },
    });
    
    res.json({ code: 200, msg: 'success', data: carRental });
  } catch (err) {
    console.error('Error creating car rental:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// GET /api/car-rentals/my - 获取当前用户的租车订单
router.get('/car-rentals/my', async (req, res) => {
  try {
    const carRentals = await prisma.carRental.findMany({
      include: { carConfig: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const formatted = carRentals.map(c => ({
      id: c.id,
      roomNumber: c.roomNumber,
      carConfig: {
        id: c.carConfig.id,
        name: c.carConfig.name,
        image: c.carConfig.image,
        price: c.carConfig.price,
        carType: c.carConfig.carType,
      },
      startTime: c.startTime.toISOString(),
      endTime: c.endTime.toISOString(),
      days: c.days,
      totalPrice: c.totalPrice,
      remark: c.remark,
      status: c.status,
      createTime: c.createdAt.toISOString().replace('T', ' ').substring(0, 19),
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching car rentals:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// GET /api/car-rentals - 获取所有租车订单
router.get('/car-rentals', async (req, res) => {
  try {
    const carRentals = await prisma.carRental.findMany({
      include: { carConfig: true },
      orderBy: { createdAt: 'desc' },
    });
    
    const formatted = carRentals.map(c => ({
      id: c.id,
      roomNumber: c.roomNumber,
      carConfig: {
        id: c.carConfig.id,
        name: c.carConfig.name,
        image: c.carConfig.image,
        price: c.carConfig.price,
        carType: c.carConfig.carType,
      },
      startTime: c.startTime.toISOString(),
      endTime: c.endTime.toISOString(),
      days: c.days,
      totalPrice: c.totalPrice,
      remark: c.remark,
      status: c.status,
      createTime: c.createdAt.toISOString().replace('T', ' ').substring(0, 19),
    }));
    
    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching car rentals:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// GET /api/car-rentals/:id - 获取单个租车订单
router.get('/car-rentals/:id', async (req, res) => {
  try {
    const carRental = await prisma.carRental.findUnique({
      where: { id: req.params.id },
      include: { carConfig: true },
    });
    
    if (!carRental) {
      return res.status(404).json({ code: 404, msg: 'Not found' });
    }
    
    res.json({
      code: 200,
      data: {
        id: carRental.id,
        roomNumber: carRental.roomNumber,
        carConfig: carRental.carConfig,
        startTime: carRental.startTime.toISOString(),
        endTime: carRental.endTime.toISOString(),
        days: carRental.days,
        totalPrice: carRental.totalPrice,
        remark: carRental.remark,
        status: carRental.status,
        createTime: carRental.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      },
    });
  } catch (err) {
    console.error('Error fetching car rental:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// POST /api/car-rentals/:id/cancel - 取消租车订单
router.post('/car-rentals/:id/cancel', async (req, res) => {
  try {
    const carRental = await prisma.carRental.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    
    res.json({ code: 200, msg: 'success', data: carRental });
  } catch (err) {
    console.error('Error cancelling car rental:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// PUT /api/car-rentals/:id/status - 更新租车订单状态 (admin)
router.put('/car-rentals/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const carRental = await prisma.carRental.update({
      where: { id: req.params.id },
      data: { status },
    });
    
    res.json({ code: 200, msg: 'success', data: carRental });
  } catch (err) {
    console.error('Error updating car rental status:', err);
    console.error('Error:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

module.exports = router;