import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET public settings (no auth required)
router.get('/', async (_req: Request, res: Response) => {
  try {
    let settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: 'default' } });
    }
    return res.json({ settings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch site settings' });
  }
});

// PUT update settings (admin only)
router.put('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { instagramPhotos, footerText, footerEmail, footerLocation } = req.body;
    const settings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: { instagramPhotos, footerText, footerEmail, footerLocation },
      create: { id: 'default', instagramPhotos, footerText, footerEmail, footerLocation },
    });
    return res.json({ settings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update site settings' });
  }
});

export default router;
