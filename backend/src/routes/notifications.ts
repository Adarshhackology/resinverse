import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 30,
    });
    const unreadCount = await prisma.notification.count({ where: { userId: req.user!.id, read: false } });
    return res.json({ notifications, unreadCount });
  } catch { return res.status(500).json({ error: 'Failed to fetch notifications' }); }
});

router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
    return res.json({ message: 'All notifications marked as read' });
  } catch { return res.status(500).json({ error: 'Failed to update notifications' }); }
});

router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: { read: true } });
    return res.json({ message: 'Notification marked as read' });
  } catch { return res.status(500).json({ error: 'Failed to update notification' }); }
});

export default router;
