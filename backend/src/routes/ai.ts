import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// POST /api/ai/recommend - AI Gift Recommendation (Local)
router.post('/recommend', optionalAuth, [
  body('age').optional().isInt({ min: 1, max: 120 }),
  body('gender').optional().isIn(['male', 'female', 'non-binary', 'any']),
  body('occasion').optional().isString(),
  body('budget').optional().isFloat({ min: 0 }),
  body('interests').optional().isArray(),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { budget, occasion, interests } = req.body;

  try {
    // Basic local recommendation engine
    // Fetch products that might match the budget or just get popular ones
    let queryArgs: any = {
      where: { isActive: true },
      select: { id: true, name: true, slug: true, price: true, discountPct: true, images: true, rating: true, reviewCount: true, description: true, tags: true },
      take: 20, // get top 20 to randomly pick from
    };

    if (budget) {
      queryArgs.where.price = { lte: parseFloat(budget) * 1.5 }; // within reasonable margin
    }

    const allProducts = await prisma.product.findMany(queryArgs);
    
    if (!allProducts || allProducts.length === 0) {
      return res.json({ recommendations: [] });
    }

    // Shuffle and pick 3 products
    const shuffled = allProducts.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    const recommendations = selected.map(p => {
      // Generate a personalized sounding reason locally
      const reason = `This ${p.name} is a perfect match for ${occasion || 'any occasion'}! It's beautifully handcrafted and uniquely designed to match their aesthetic style.`;
      const giftMessage = `I saw this ${p.name} and immediately thought of you. Hope you love it! 💜`;
      
      return {
        productId: p.id,
        reason,
        giftMessage,
        matchScore: Math.floor(Math.random() * 15) + 85, // 85-99 score
        product: p
      };
    });

    return res.json({ recommendations });
  } catch (err) {
    console.error('Local recommend error:', err);
    return res.status(500).json({ error: 'Recommendation engine failed.' });
  }
});

// POST /api/ai/generate-design - AI Product Design Generator (Local)
router.post('/generate-design', optionalAuth, [
  body('name').optional().isString(),
  body('theme').optional().isString(),
  body('colors').optional().isArray(),
  body('productType').optional().isString(),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, theme, colors, productType } = req.body;

  try {
    // Generate beautiful local designs using templates
    const colorPalette1 = (colors && colors.length > 0) ? colors : ['#E6E6FA', '#FFB6C1'];
    const colorPalette2 = ['#FFFACD', '#E0FFFF', '#FFDAB9'];
    const colorPalette3 = ['#D8BFD8', '#F0E68C'];

    const type = productType || 'keychain';
    const aesthetic = theme || 'dreamy aesthetic';
    const forName = name ? ` personalized with "${name}"` : '';

    const designs = {
      designs: [
        {
          name: `Ethereal ${type} Dream`,
          palette: colorPalette1,
          inclusions: ['Dried lavender', 'Gold flakes', 'Clear quartz'],
          shape: `Classic ${type} shape with soft rounded edges`,
          finishing: 'High-gloss clear top coat with a subtle holographic shimmer',
          vibe: `A breathtaking, ${aesthetic} piece${forName}. It perfectly captures the light, creating a glowing, ethereal feeling that feels incredibly premium.`
        },
        {
          name: `Midnight Glow ${type}`,
          palette: colorPalette2,
          inclusions: ['Crushed opal', 'Silver foil', 'Miniature pressed daisies'],
          shape: 'Sleek, minimalist geometric mold',
          finishing: 'Smooth matte finish with glossy raised details',
          vibe: `An edgy yet soft ${aesthetic} design${forName}. The contrast between the matte base and sparkling inclusions makes it a truly unique statement piece.`
        },
        {
          name: `Floral Nostalgia ${type}`,
          palette: colorPalette3,
          inclusions: ['Preserved rose petals', 'Rose gold leaf', 'Pearl dust'],
          shape: 'Vintage-inspired ornate mold',
          finishing: 'Crystal clear dome finish for maximum depth',
          vibe: `A romantic, timeless ${aesthetic} piece${forName}. It feels like a beautiful memory preserved forever in glass-like resin.`
        }
      ]
    };

    return res.json(designs);
  } catch (err) {
    console.error('Local generate error:', err);
    return res.status(500).json({ error: 'Design generation failed.' });
  }
});

// POST /api/ai/chat - AI Chat Assistant (Local)
router.post('/chat', optionalAuth, [
  body('message').notEmpty().isString().isLength({ max: 500 }),
  body('history').optional().isArray(),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { message } = req.body;
  const msgLower = message.toLowerCase();

  try {
    let response = "I'm your ResinVerse assistant! I can help you find products, answer questions about shipping, or help with custom orders. What can I do for you today? 🌸";

    if (msgLower.includes('shipping') || msgLower.includes('delivery') || msgLower.includes('track')) {
      response = "📦 We offer free shipping on orders above ₹999! Standard delivery takes 5-7 business days, and Express delivery takes 2-3 days. Custom orders require an additional 7-14 days to craft. Once your order ships, we'll send you a tracking link! 🚚";
    } else if (msgLower.includes('return') || msgLower.includes('refund') || msgLower.includes('exchange')) {
      response = "🔁 We accept returns within 7 days of delivery for defective or damaged products. Because our items are custom handmade, we don't accept returns for change of mind. Just email us at hello@resinverse.in with photos if there's an issue!";
    } else if (msgLower.includes('custom') || msgLower.includes('personalize') || msgLower.includes('make my own')) {
      response = "✨ Yes! We love making custom pieces. You can personalize almost any product with names, specific colors, flowers, or gold flakes. Just use our Design Generator tool or add your requests in the order notes! Custom orders take 7-14 days to perfect.";
    } else if (msgLower.includes('price') || msgLower.includes('cost') || msgLower.includes('expensive')) {
      response = "💰 Our beautifully handcrafted pieces range from ₹99 (for small phone charms) up to ₹2999 (for large custom statement pieces). We try to offer something gorgeous for every budget!";
    } else if (msgLower.includes('gift') || msgLower.includes('present') || msgLower.includes('girlfriend') || msgLower.includes('boyfriend') || msgLower.includes('wife')) {
      response = "🎁 Resin art makes the absolute perfect gift! It's unique, aesthetic, and lasts forever. I recommend checking out our Lockest or Custom Keychains. You can also try out our Gift Recommender tool to find the exact perfect piece!";
    } else if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey')) {
      response = "Hi there! 👋 I'm Resina. How can I add a little sparkle to your day? Let me know if you need help finding anything!";
    } else if (msgLower.includes('thank')) {
      response = "You're so welcome! 💜 Let me know if you need anything else!";
    }

    return res.json({ response, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Local chat error:', err);
    return res.status(500).json({ error: 'Chat service temporarily unavailable.' });
  }
});

export default router;
