import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// ─── MANUAL UPI PAYMENT ROUTES ────────────────────────────────────────────────

// POST /api/payments/manual/create - Create a manual UPI payment record
router.post('/manual/create', authenticate, async (req: AuthRequest, res: Response) => {
  const { orderId } = req.body;
  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.id },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check if payment already exists
    let payment = await prisma.payment.findFirst({ where: { orderId: order.id } });
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          userId: req.user!.id,
          gateway: 'MANUAL_UPI',
          amount: order.total,
          status: 'PENDING',
        },
      });
    } else if (payment.status === 'FAILED') {
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PENDING', gateway: 'MANUAL_UPI' }
      });
    }

    return res.json({ success: true, paymentId: payment.id });
  } catch (err) {
    console.error('Manual payment create error:', err);
    return res.status(500).json({ error: 'Failed to initiate manual payment' });
  }
});

// GET /api/payments/manual/status/:orderId - Poll payment status
router.get('/manual/status/:orderId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { orderId: req.params.orderId },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    return res.json({ status: payment.status });
  } catch (err) {
    console.error('Status check error:', err);
    return res.status(500).json({ error: 'Failed to check status' });
  }
});

// ─── RAZORPAY ROUTES (Kept for backward compatibility) ────────────────────────

router.post('/razorpay/create', authenticate, async (req: AuthRequest, res: Response) => {
  const { orderId } = req.body;
  
  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.id },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // convert to paise
      currency: 'INR',
      receipt: `rcpt_${order.id.slice(-8)}`,
      notes: { orderId: order.id, userId: req.user!.id },
    });

    // Save payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id, userId: req.user!.id,
        gateway: 'RAZORPAY', razorpayOrderId: razorpayOrder.id,
        amount: order.total, status: 'PENDING',
        metadata: { razorpayOrderId: razorpayOrder.id },
      },
    });

    return res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment.id,
    });
  } catch (err) {
    console.error('Razorpay create error:', err);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// POST /api/payments/razorpay/verify - Verify payment signature
router.post('/razorpay/verify', authenticate, async (req: AuthRequest, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  try {
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed - invalid signature' });
    }

    // Update payment and order status
    const [updatedPayment, updatedOrder] = await prisma.$transaction([
      prisma.payment.update({
        where: { orderId },
        data: { status: 'PAID', transactionId: razorpay_payment_id, metadata: { razorpay_order_id, razorpay_payment_id, razorpay_signature } },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
        include: { user: true }
      }),
    ]);

    // Send Admin Email Alert (non-blocking)
    import('../lib/mailer').then(({ sendPaymentAdminAlert }) => {
      sendPaymentAdminAlert(
        updatedOrder.id,
        updatedOrder.totalAmount,
        updatedOrder.user.name || 'Customer',
        updatedOrder.user.email,
        updatedOrder.user.phone || ''
      );
    }).catch(e => console.error('Failed to trigger alert:', e));

    return res.json({ success: true, message: 'Payment verified successfully' });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
});

// POST /api/payments/razorpay/webhook - Razorpay webhook
router.post('/razorpay/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = req.body;
  console.log('Razorpay webhook event:', event.event);

  try {
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.notes?.orderId;
      if (orderId) {
        await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });
        await prisma.payment.update({ where: { orderId }, data: { status: 'PAID', transactionId: payment.id } });
      }
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const orderId = payment.notes?.orderId;
      if (orderId) {
        await prisma.payment.update({ where: { orderId }, data: { status: 'FAILED' } });
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  return res.json({ status: 'ok' });
});

// GET /api/payments/my - User's payment history
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { id: true, status: true, total: true } } },
    });
    return res.json({ payments });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

export default router;
