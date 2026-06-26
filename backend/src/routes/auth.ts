import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const generateToken = (user: { id: string; email: string; role: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );
};

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name, phone } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, phone, referralCode: generateReferralCode() },
      select: { id: true, email: true, name: true, role: true, avatar: true, loyaltyPoints: true },
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({ message: 'Account created successfully', user, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, loyaltyPoints: user.loyaltyPoints },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, name: true, role: true,
        avatar: true, phone: true, loyaltyPoints: true,
        referralCode: true, isVerified: true, createdAt: true,
        _count: { select: { orders: true, reviews: true, wishlist: true } },
      },
    });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/auth/me
router.put('/me', authenticate, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone('any'),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, phone, avatar } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, phone, avatar },
      select: { id: true, email: true, name: true, avatar: true, phone: true, loyaltyPoints: true },
    });
    return res.json({ user });
  } catch {
    return res.status(500).json({ error: 'Update failed' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.passwordHash) return res.status(400).json({ error: 'Cannot change password for OAuth accounts' });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return res.status(400).json({ error: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return res.json({ message: 'Password changed successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /api/auth/google (Google OAuth stub - accepts token from frontend)
router.post('/google', [
  body('googleToken').notEmpty(),
  body('email').isEmail(),
  body('name').notEmpty(),
], async (req: Request, res: Response) => {
  const { email, name, avatar, googleId } = req.body;
  
  try {
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: { email, name, avatar, googleId, isVerified: true, referralCode: generateReferralCode() },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId, avatar } });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.cookie('token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar }, token });
  } catch {
    return res.status(500).json({ error: 'Google auth failed' });
  }
});

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default router;
