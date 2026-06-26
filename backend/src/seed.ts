import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  { name: 'Keychains', slug: 'keychains', description: 'Cute handmade resin keychains', icon: '🔑', sortOrder: 1 },
  { name: 'Lockets', slug: 'lockets', description: 'Beautiful resin lockets with flowers & charms', icon: '💝', sortOrder: 2 },
  { name: 'Rings', slug: 'rings', description: 'Handcrafted resin rings for every occasion', icon: '💍', sortOrder: 3 },
  { name: 'Bracelets', slug: 'bracelets', description: 'Elegant resin bracelets', icon: '📿', sortOrder: 4 },
  { name: 'Earrings', slug: 'earrings', description: 'Lightweight resin earrings in stunning designs', icon: '✨', sortOrder: 5 },
  { name: 'Name Tags', slug: 'name-tags', description: 'Personalized resin name tags & badges', icon: '🏷️', sortOrder: 6 },
  { name: 'Bookmarks', slug: 'bookmarks', description: 'Dreamy resin bookmarks for book lovers', icon: '📚', sortOrder: 7 },
  { name: 'Phone Charms', slug: 'phone-charms', description: 'Y2K aesthetic phone charms', icon: '📱', sortOrder: 8 },
  { name: 'Couple Gifts', slug: 'couple-gifts', description: 'Matching resin sets for couples', icon: '💑', sortOrder: 9 },
  { name: 'Custom Gifts', slug: 'custom-gifts', description: 'Fully personalized resin gifts', icon: '🎁', sortOrder: 10 },
];

const sampleProducts = [
  {
    name: 'Preserved Rose Keychain',
    description: 'A stunning keychain featuring a real preserved rose encased in crystal-clear resin. Each piece is unique and handcrafted with love. Perfect for gifting or as a personal keepsake.',
    price: 299,
    discountPct: 10,
    stock: 50,
    material: 'Epoxy Resin, Preserved Rose',
    tags: ['rose', 'floral', 'romantic', 'gift', 'keychain'],
    colors: ['Pink', 'Red', 'White'],
    isFeatured: true,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 124,
  },
  {
    name: 'Galaxy Glitter Locket',
    description: 'Mesmerizing galaxy-themed locket with iridescent glitter and tiny star inclusions. Opens to reveal a small photo compartment. A celestial piece of wearable art.',
    price: 549,
    discountPct: 0,
    stock: 30,
    material: 'Epoxy Resin, Gold-plated chain',
    tags: ['galaxy', 'glitter', 'stars', 'space', 'locket'],
    colors: ['Purple', 'Blue', 'Holographic'],
    isFeatured: true,
    isBestSeller: false,
    rating: 4.9,
    reviewCount: 87,
  },
  {
    name: 'Pastel Flower Ring',
    description: 'Delicate ring with tiny dried flowers embedded in pastel-tinted resin. Available in multiple sizes. Lightweight and comfortable for everyday wear.',
    price: 199,
    discountPct: 15,
    stock: 80,
    material: 'UV Resin, Dried Flowers',
    tags: ['floral', 'pastel', 'ring', 'dainty', 'everyday'],
    colors: ['Lavender', 'Pink', 'Mint'],
    isFeatured: false,
    isBestSeller: true,
    rating: 4.7,
    reviewCount: 203,
  },
  {
    name: 'Custom Name Keychain',
    description: 'Personalized keychain with your name beautifully embedded in resin with gold foil. Choose your color, glitter, and design. The perfect personalized gift.',
    price: 349,
    discountPct: 0,
    stock: 100,
    material: 'Epoxy Resin, Gold Foil',
    tags: ['custom', 'name', 'personalized', 'gift', 'keychain'],
    colors: ['Any'],
    isFeatured: true,
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 456,
  },
  {
    name: 'Ocean Wave Bracelet',
    description: 'A wearable piece of the ocean — layers of blue resin with real sand and tiny shells create a stunning ocean wave effect. Adjustable sizing.',
    price: 449,
    discountPct: 20,
    stock: 40,
    material: 'Epoxy Resin, Sand, Shells',
    tags: ['ocean', 'beach', 'waves', 'summer', 'bracelet'],
    colors: ['Ocean Blue', 'Teal', 'Sandy'],
    isFeatured: false,
    isBestSeller: false,
    rating: 4.6,
    reviewCount: 65,
  },
  {
    name: 'Couple Heart Set',
    description: 'Matching heart-shaped resin pendants for couples. One half of a heart each — together they form a complete heart with intertwined designs. Comes in a gift box.',
    price: 799,
    discountPct: 10,
    stock: 25,
    material: 'Epoxy Resin, Silver-plated',
    tags: ['couple', 'matching', 'heart', 'love', 'gift'],
    colors: ['Rose Gold', 'Silver', 'Gold'],
    isFeatured: true,
    isBestSeller: false,
    rating: 4.9,
    reviewCount: 312,
  },
  {
    name: 'Butterfly Earrings Set',
    description: 'Lightweight resin butterfly earrings with iridescent shimmer. These gorgeous statement pieces catch the light beautifully. Hypoallergenic hooks included.',
    price: 249,
    discountPct: 0,
    stock: 60,
    material: 'UV Resin, Hypoallergenic Hooks',
    tags: ['butterfly', 'earrings', 'iridescent', 'statement', 'lightweight'],
    colors: ['Purple', 'Pink', 'Blue'],
    isFeatured: false,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 178,
  },
  {
    name: 'Book Lover Bookmark',
    description: 'Handcrafted resin bookmark with pressed flowers and a golden tassel. Makes reading even more aesthetic. A must-have for every bookworm.',
    price: 149,
    discountPct: 0,
    stock: 75,
    material: 'UV Resin, Pressed Flowers, Gold Tassel',
    tags: ['bookmark', 'books', 'floral', 'aesthetic', 'reader'],
    colors: ['Golden', 'Pink', 'Lavender'],
    isFeatured: false,
    isBestSeller: false,
    rating: 4.7,
    reviewCount: 89,
  },
  {
    name: 'Y2K Phone Charm',
    description: 'Super cute Y2K-inspired phone charm with pastel stars, tiny hearts, and holographic glitter. Attach to any phone case with the included loop.',
    price: 199,
    discountPct: 5,
    stock: 90,
    material: 'UV Resin, Phone Loop',
    tags: ['y2k', 'phone', 'charm', 'cute', 'holographic'],
    colors: ['Pink', 'Blue', 'Holographic'],
    isFeatured: true,
    isBestSeller: false,
    rating: 4.8,
    reviewCount: 234,
  },
  {
    name: 'Personalized Name Badge',
    description: 'Custom resin name badge/tag with your name, title, or any text. Perfect for professionals, students, or gifts. Pin-back and lanyard hole included.',
    price: 279,
    discountPct: 0,
    stock: 50,
    material: 'Epoxy Resin, Pin Back',
    tags: ['name', 'badge', 'professional', 'custom', 'tag'],
    colors: ['Black', 'White', 'Marble'],
    isFeatured: false,
    isBestSeller: false,
    rating: 4.6,
    reviewCount: 45,
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@resinverse.in' },
    update: {},
    create: {
      email: 'admin@resinverse.in',
      name: 'ResinVerse Admin',
      role: 'ADMIN',
      passwordHash: adminPassword,
      isVerified: true,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create test user
  const userPassword = await bcrypt.hash('User@123', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@resinverse.in' },
    update: {},
    create: {
      email: 'test@resinverse.in',
      name: 'Priya Sharma',
      role: 'USER',
      passwordHash: userPassword,
      isVerified: true,
      loyaltyPoints: 150,
    },
  });
  console.log(`✅ Test user created: ${testUser.email}`);

  // Create categories
  const createdCategories: any[] = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
  }
  console.log(`✅ ${createdCategories.length} categories created`);

  // Map products to categories
  const categoryMap: Record<string, string> = {
    'Preserved Rose Keychain': 'keychains',
    'Galaxy Glitter Locket': 'lockets',
    'Pastel Flower Ring': 'rings',
    'Custom Name Keychain': 'keychains',
    'Ocean Wave Bracelet': 'bracelets',
    'Couple Heart Set': 'couple-gifts',
    'Butterfly Earrings Set': 'earrings',
    'Book Lover Bookmark': 'bookmarks',
    'Y2K Phone Charm': 'phone-charms',
    'Personalized Name Badge': 'name-tags',
  };

  const createdProducts: any[] = [];
  for (const product of sampleProducts) {
    const categorySlug = categoryMap[product.name];
    const category = createdCategories.find(c => c.slug === categorySlug);
    if (!category) continue;

    const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const created = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: product.name,
        description: product.description,
        price: product.price,
        discountPct: product.discountPct,
        stock: product.stock,
        material: product.material,
        isFeatured: product.isFeatured,
        isBestSeller: product.isBestSeller,
        rating: product.rating,
        reviewCount: product.reviewCount,
        slug,
        categoryId: category.id,
        tags: JSON.stringify(product.tags),
        colors: JSON.stringify(product.colors),
        sizes: JSON.stringify([]),
        images: JSON.stringify([
          `https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600`,
          `https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600`,
        ]),
      },
    });
    createdProducts.push(created);

  }
  console.log(`✅ ${createdProducts.length} products created`);

  // Create sample coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: { code: 'WELCOME20', description: 'Welcome discount - 20% off your first order', discountPct: 20, minOrder: 299, maxDiscount: 500, maxUses: 1000 },
  });
  await prisma.coupon.upsert({
    where: { code: 'RESIN50' },
    update: {},
    create: { code: 'RESIN50', description: '₹50 off on orders above ₹499', discountAmt: 50, minOrder: 499, maxUses: 500 },
  });
  await prisma.coupon.upsert({
    where: { code: 'LOVE15' },
    update: {},
    create: { code: 'LOVE15', description: '15% off couple gifts', discountPct: 15, minOrder: 699, maxDiscount: 300, maxUses: 200 },
  });
  console.log(`✅ Coupons created: WELCOME20, RESIN50, LOVE15`);

  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin: admin@resinverse.in / Admin@123');
  console.log('  User:  test@resinverse.in  / User@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
