import { Router, Request, Response } from 'express';
import { query, body, param, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Parse JSON string arrays stored in SQLite back to real arrays
function parseProduct(p: any) {
  if (!p) return p;
  return {
    ...p,
    images: p.images ? JSON.parse(p.images) : [],
    tags: p.tags ? JSON.parse(p.tags) : [],
    colors: p.colors ? JSON.parse(p.colors) : [],
    sizes: p.sizes ? JSON.parse(p.sizes) : [],
    reviews: p.reviews ? p.reviews.map((r: any) => ({
      ...r,
      images: r.images ? JSON.parse(r.images) : [],
    })) : undefined,
  };
}

// GET /api/products - List with search, filter, sort, paginate
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().isString(),
  query('categoryId').optional().isString(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('rating').optional().isFloat({ min: 0, max: 5 }),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'rating', 'newest', 'bestseller']),
  query('featured').optional().isBoolean(),
], async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;

  const where: any = { isActive: true };

  if (req.query.search) {
    const q = req.query.search as string;
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
    ];
  }

  if (req.query.categoryId) {
    where.category = { slug: req.query.categoryId as string };
  }
  if (req.query.minPrice || req.query.maxPrice) {
    where.price = {};
    if (req.query.minPrice) where.price.gte = parseFloat(req.query.minPrice as string);
    if (req.query.maxPrice) where.price.lte = parseFloat(req.query.maxPrice as string);
  }
  if (req.query.rating) where.rating = { gte: parseFloat(req.query.rating as string) };
  if (req.query.featured === 'true') where.isFeatured = true;
  if (req.query.bestseller === 'true') where.isBestSeller = true;
  // color filter: SQLite string contains check
  // (not as precise as PostgreSQL array ops but functional)

  const orderBy: any = {};
  switch (req.query.sort) {
    case 'price_asc': orderBy.price = 'asc'; break;
    case 'price_desc': orderBy.price = 'desc'; break;
    case 'rating': orderBy.rating = 'desc'; break;
    case 'bestseller': orderBy.reviewCount = 'desc'; break;
    default: orderBy.createdAt = 'desc';
  }

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy, skip, take: limit,
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      products: products.map(parseProduct),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Get related products
    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
      take: 6,
      select: { id: true, name: true, slug: true, price: true, discountPct: true, images: true, rating: true, reviewCount: true },
    });

    return res.json({ product: parseProduct(product), related: related.map(parseProduct) });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET /api/products/slug/:slug
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        reviews: {
          take: 10,
          orderBy: { helpful: 'desc' },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
      take: 6,
      select: { id: true, name: true, slug: true, price: true, discountPct: true, images: true, rating: true, reviewCount: true },
    });
    return res.json({ product: parseProduct(product), related: related.map(parseProduct) });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Admin only
router.post('/', authenticate, requireAdmin, [
  body('name').trim().notEmpty(),
  body('description').notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('categoryId').notEmpty(),
  body('stock').isInt({ min: 0 }),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, price, discountPct, images, video, categoryId, stock, material, tags, colors, sizes, isFeatured, isBestSeller, weight, dimensions } = req.body;

  // Generate slug
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

  try {
    const product = await prisma.product.create({
      data: {
        name, slug, description,
        price: parseFloat(price),
        discountPct: parseFloat(discountPct) || 0,
        images: JSON.stringify(Array.isArray(images) ? images : []),
        video: video || null,
        categoryId,
        stock: parseInt(stock) || 0,
        material: material || null,
        tags: JSON.stringify(Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : [])),
        colors: JSON.stringify(Array.isArray(colors) ? colors : (colors ? colors.split(',').map((c: string) => c.trim()) : [])),
        sizes: JSON.stringify(Array.isArray(sizes) ? sizes : []),
        isFeatured: isFeatured === true || isFeatured === 'true',
        isBestSeller: isBestSeller === true || isBestSeller === 'true',
        weight: weight ? parseFloat(weight) : null,
        dimensions: dimensions || null,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    return res.status(201).json({ product: parseProduct(product) });
  } catch (e) {
    console.error('Create product error:', e);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Admin only
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, description, price, discountPct, images, video, categoryId, stock, material, tags, colors, sizes, isFeatured, isBestSeller, isActive, weight, dimensions } = req.body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = parseFloat(price);
  if (discountPct !== undefined) updateData.discountPct = parseFloat(discountPct) || 0;
  if (images !== undefined) updateData.images = JSON.stringify(Array.isArray(images) ? images : []);
  if (video !== undefined) updateData.video = video || null;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (stock !== undefined) updateData.stock = parseInt(stock) || 0;
  if (material !== undefined) updateData.material = material || null;
  if (tags !== undefined) updateData.tags = JSON.stringify(Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []));
  if (colors !== undefined) updateData.colors = JSON.stringify(Array.isArray(colors) ? colors : (colors ? colors.split(',').map((c: string) => c.trim()) : []));
  if (sizes !== undefined) updateData.sizes = JSON.stringify(Array.isArray(sizes) ? sizes : []);
  if (isFeatured !== undefined) updateData.isFeatured = isFeatured === true || isFeatured === 'true';
  if (isBestSeller !== undefined) updateData.isBestSeller = isBestSeller === true || isBestSeller === 'true';
  if (isActive !== undefined) updateData.isActive = isActive === true || isActive === 'true';
  if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
  if (dimensions !== undefined) updateData.dimensions = dimensions || null;

  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    return res.json({ product: parseProduct(product) });
  } catch (e) {
    console.error('Update product error:', e);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Admin only
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    return res.json({ message: 'Product deactivated successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
