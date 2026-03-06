const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const cache = require('../cache');
const { verifyAdmin } = require('../middleware/auth.middleware');
const { JWT_SECRET } = require('../middleware/auth.middleware');

// GET /api/homestays - List all homestays with filters
router.get('/', async (req, res) => {
  try {
    const {
      category,
      keyword,
      minPrice,
      maxPrice,
      bedrooms,
      amenities,
      sortBy,
      checkIn,
      checkOut,
      guests
    } = req.query;

    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // Token invalid, continue as guest
      }
    }

    const where = {};

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { location: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'all') {
      where.type = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice);
      if (maxPrice) where.price.lte = parseInt(maxPrice);
    }

    if (bedrooms) {
      where.bedrooms = { gte: parseInt(bedrooms) };
    }

    if (amenities) {
      const amenityList = amenities.split(',').map(a => a.trim()).filter(Boolean);
      if (amenityList.length > 0) {
        where.amenities = { hasEvery: amenityList };
      }
    }

    if (guests) {
      where.guests = { gte: parseInt(guests) };
    }

    let orderBy = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const homestays = await prisma.homestay.findMany({
      where,
      orderBy,
      include: {
        stocks: true,
      },
    });

    let userFavorites = new Set();
    if (userId) {
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        select: { houseId: true },
      });
      favorites.forEach(f => userFavorites.add(f.houseId));
    }

    const formatted = homestays.map(h => ({
      id: h.id,
      title: h.title,
      location: h.location,
      price: h.price,
      rating: h.rating,
      images: h.images,
      type: h.type,
      guests: h.guests,
      bedrooms: h.bedrooms,
      beds: h.beds,
      bathrooms: h.bathrooms,
      amenities: h.amenities,
      isFavorite: userFavorites.has(h.id),
    }));

    res.json({ code: 200, data: formatted });
  } catch (err) {
    console.error('Error fetching homestays:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// GET /api/homestays/:id - Get homestay by ID
router.get('/:id', async (req, res) => {
  try {
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // Token invalid
      }
    }

    const homestay = await prisma.homestay.findUnique({
      where: { id: req.params.id },
      include: { stocks: true },
    });

    if (!homestay) {
      return res.status(404).json({ code: 404, msg: 'Not found' });
    }

    let isFavorite = false;
    if (userId) {
      const favorite = await prisma.favorite.findFirst({
        where: { userId, houseId: homestay.id },
      });
      isFavorite = !!favorite;
    }

    const reviewStats = await prisma.review.aggregate({
      where: { houseId: homestay.id, status: 'active' },
      _avg: { rating: true },
      _count: { id: true },
    });

    const rating = reviewStats._avg.rating || 0;
    const reviewCount = reviewStats._count.id || 0;

    res.json({
      code: 200,
      data: {
        id: homestay.id,
        title: homestay.title,
        location: homestay.location,
        price: homestay.price,
        rating: Math.round(rating * 10) / 10,
        reviews: reviewCount,
        images: homestay.images,
        type: homestay.type,
        guests: homestay.guests,
        bedrooms: homestay.bedrooms,
        beds: homestay.beds,
        bathrooms: homestay.bathrooms,
        amenities: homestay.amenities,
        description: homestay.description,
        isFavorite,
        host: {
          name: homestay.hostName,
          avatar: homestay.hostAvatar,
          isSuperhost: homestay.isSuperhost,
        },
      },
    });
  } catch (err) {
    console.error('Error fetching homestay:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// POST /api/homestays - Create homestay (admin only)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { title, location, price, images, type, guests, bedrooms, beds, bathrooms, amenities, description } = req.body;

    const homestay = await prisma.homestay.create({
      data: {
        title,
        location,
        price: parseInt(price),
        images: images || [],
        type: type || '城市',
        guests: guests !== undefined && guests !== '' ? parseInt(guests) : 2,
        bedrooms: bedrooms !== undefined && bedrooms !== '' ? parseInt(bedrooms) : 1,
        beds: beds !== undefined && beds !== '' ? parseInt(beds) : 1,
        bathrooms: bathrooms !== undefined && bathrooms !== '' ? parseInt(bathrooms) : 1,
        amenities: amenities || [],
        description,
        hostName: 'Admin',
        hostAvatar: '',
        isSuperhost: false,
      },
    });

    cache.del('homestays:all');

    res.json({ code: 200, data: homestay });
  } catch (err) {
    console.error('Error creating homestay:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// PUT /api/homestays/:id - Update homestay (admin only)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, location, price, images, type, guests, bedrooms, beds, bathrooms, amenities, description } = req.body;

    const homestay = await prisma.homestay.update({
      where: { id: req.params.id },
      data: {
        title,
        location,
        price: parseInt(price),
        images: images || [],
        type,
        guests: guests !== undefined ? parseInt(guests) : undefined,
        bedrooms: bedrooms !== undefined ? parseInt(bedrooms) : undefined,
        beds: beds !== undefined ? parseInt(beds) : undefined,
        bathrooms: bathrooms !== undefined ? parseInt(bathrooms) : undefined,
        amenities: amenities || [],
        description,
      },
    });

    cache.del('homestays:all');
    cache.del(`homestay:${req.params.id}`);

    res.json({ code: 200, data: homestay });
  } catch (err) {
    console.error('Error updating homestay:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// DELETE /api/homestays/:id - Delete homestay (admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    await prisma.homestay.delete({
      where: { id: req.params.id },
    });

    cache.del('homestays:all');
    cache.del(`homestay:${req.params.id}`);

    res.json({ code: 200, msg: '删除成功' });
  } catch (err) {
    console.error('Error deleting homestay:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

module.exports = router;
