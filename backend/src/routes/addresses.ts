import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json({ addresses });
  } catch { return res.status(500).json({ error: 'Failed to fetch addresses' }); }
});

router.post('/', authenticate, [
  body('name').notEmpty(), body('phone').isMobilePhone('any'),
  body('line1').notEmpty(), body('city').notEmpty(),
  body('state').notEmpty(), body('pincode').isLength({ min: 6, max: 6 }),
], async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, phone, line1, line2, city, state, pincode, country, label, isDefault } = req.body;
  try {
    if (isDefault) await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    const address = await prisma.address.create({
      data: { userId: req.user!.id, name, phone, line1, line2, city, state, pincode, country: country || 'India', label: label || 'Home', isDefault: isDefault || false },
    });
    return res.status(201).json({ address });
  } catch { return res.status(500).json({ error: 'Failed to add address' }); }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.body.isDefault) await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    const address = await prisma.address.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: req.body });
    return res.json({ address });
  } catch { return res.status(500).json({ error: 'Failed to update address' }); }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.address.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
    return res.json({ message: 'Address deleted' });
  } catch { return res.status(500).json({ error: 'Failed to delete address' }); }
});

export default router;
