import { Router, Request, Response } from 'express';
import { trackShipment } from '../lib/shiprocket';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/tracking/:orderId
router.get('/:orderId', authenticate, async (req: any, res: Response) => {
  try {
    // 1. Fetch order from DB to get the AWB tracking number
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: { userId: true, trackingNum: true, status: true, courierName: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Security: Users can only track their own orders
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to track this order' });
    }

    if (!order.trackingNum) {
      return res.status(400).json({ error: 'No tracking number assigned to this order yet' });
    }

    // 2. Fetch live data from Shiprocket
    const trackingData = await trackShipment(order.trackingNum);

    // Shiprocket returns data under tracking_data
    return res.json({ 
      tracking: trackingData.tracking_data, 
      courier: order.courierName 
    });
  } catch (err) {
    console.error('Error fetching tracking:', err);
    return res.status(500).json({ error: 'Failed to fetch tracking details from courier' });
  }
});

export default router;
