import { Router, Response } from 'express';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { optionalAuth } from '../middleware/auth';

const router = Router();

const getGeminiModel = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
  });
};

// POST /api/ai/recommend - AI Gift Recommendation
router.post('/recommend', optionalAuth, [
  body('age').optional().isInt({ min: 1, max: 120 }),
  body('gender').optional().isIn(['male', 'female', 'non-binary', 'any']),
  body('occasion').optional().isString(),
  body('budget').optional().isFloat({ min: 0 }),
  body('interests').optional().isArray(),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { age, gender, occasion, budget, interests } = req.body;

  try {
    // Fetch all active products for context
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true, price: true, discountPct: true, tags: true, categoryId: true, rating: true, images: true },
      take: 50,
    });

    const model = getGeminiModel();
    const prompt = `You are a gifting expert for ResinVerse, a handmade resin art store in India. 
    
Customer Profile:
- Age: ${age || 'not specified'}
- Gender: ${gender || 'any'}
- Occasion: ${occasion || 'general'}
- Budget: ₹${budget || 'flexible'}
- Interests: ${interests?.join(', ') || 'general'}

Available Products:
${products.map(p => `ID: ${p.id} | Name: ${p.name} | Price: ₹${p.price * (1 - p.discountPct / 100)} | Tags: ${(typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags || []).join(', ')} | Rating: ${p.rating}`).join('\n')}

Recommend 3-5 most suitable products from the list. For each recommendation, provide:
1. Product ID
2. Why it's perfect for this person
3. A personalized gift message idea

Respond in JSON format: {"recommendations": [{"productId": "...", "reason": "...", "giftMessage": "...", "matchScore": 0-100}]}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'AI response parsing failed' });
    
    const aiRecommendations = JSON.parse(jsonMatch[0]);
    
    // Fetch recommended products with full details
    const recommendedIds = aiRecommendations.recommendations?.map((r: any) => r.productId) || [];
    const recommendedProducts = await prisma.product.findMany({
      where: { id: { in: recommendedIds } },
      select: { id: true, name: true, slug: true, price: true, discountPct: true, images: true, rating: true, reviewCount: true, description: true },
    });

    const enrichedRecommendations = aiRecommendations.recommendations?.map((r: any) => ({
      ...r,
      product: recommendedProducts.find(p => p.id === r.productId),
    })) || [];

    return res.json({ recommendations: enrichedRecommendations });
  } catch (err) {
    console.error('AI recommend error:', err);
    return res.status(500).json({ error: 'AI recommendation failed. Please try again.' });
  }
});

// POST /api/ai/generate-design - AI Product Design Generator
router.post('/generate-design', optionalAuth, [
  body('name').optional().isString(),
  body('theme').optional().isString(),
  body('colors').optional().isArray(),
  body('productType').optional().isString(),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, theme, colors, productType, occasion } = req.body;

  try {
    const model = getGeminiModel();
    const prompt = `You are a creative resin art designer for ResinVerse, a Gen Z aesthetic resin art brand in India.

Design Request:
- Name to include: ${name || 'none'}
- Theme: ${theme || 'aesthetic/cute'}
- Colors: ${colors?.join(', ') || 'any beautiful colors'}
- Product type: ${productType || 'keychain'}
- Occasion: ${occasion || 'general'}

Generate 3 unique resin art design concepts. Each concept should include:
1. Design name (aesthetic, trendy Gen Z style)
2. Color palette (hex codes)
3. Inclusions (flowers, glitter, shells, etc.)
4. Shape/mold suggestion
5. Finishing details
6. Aesthetic vibe description (2-3 sentences, very visual and evocative)

Respond in JSON: {"designs": [{"name": "...", "palette": ["#hex1", "#hex2"], "inclusions": ["..."], "shape": "...", "finishing": "...", "vibe": "..."}]}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'AI response parsing failed' });
    
    const designs = JSON.parse(jsonMatch[0]);
    return res.json(designs);
  } catch (err) {
    console.error('AI generate error:', err);
    return res.status(500).json({ error: 'AI design generation failed. Please try again.' });
  }
});

// POST /api/ai/chat - AI Chat Assistant
router.post('/chat', optionalAuth, [
  body('message').notEmpty().isString().isLength({ max: 500 }),
  body('history').optional().isArray(),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { message, history = [] } = req.body;

  try {
    const model = getGeminiModel();
    
    const systemContext = `You are Resina, the friendly AI assistant for ResinVerse - a handmade resin art e-commerce store in India.

About ResinVerse:
- We sell handmade resin products: keychains, lockets, rings, bracelets, earrings, name tags, bookmarks, phone charms, couple gifts
- All products are handcrafted with love
- We offer customization for most products
- Prices range from ₹99 to ₹2999
- Free shipping on orders above ₹999
- We accept Razorpay (UPI, cards, net banking)
- Delivery: 5-7 business days (standard), 2-3 days (express)
- Returns accepted within 7 days for defective products
- Custom orders take 7-14 business days

You are helpful, friendly, and speak in a mix of English and casual Indian English. Use emojis occasionally. Keep responses concise and helpful. If asked about specific orders, politely ask for the order ID.`;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'System context: ' + systemContext }],
        },
        {
          role: 'model',
          parts: [{ text: 'Hi! I\'m Resina, your ResinVerse assistant! ✨ How can I help you today? Whether it\'s about our products, orders, or custom designs, I\'m here to help! 🌸' }],
        },
        ...history.map((h: any) => ({
          role: h.role as 'user' | 'model',
          parts: [{ text: h.content }],
        })),
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return res.json({ response, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({ error: 'Chat service temporarily unavailable. Please try again.' });
  }
});

export default router;
