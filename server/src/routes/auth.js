import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { generateToken, setTokenCookie, authenticate } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ============================================
// POST /api/auth/register
// ============================================
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

// ============================================
// POST /api/auth/login
// ============================================
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================
// POST /api/auth/logout
// ============================================
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

// ============================================
// GET /api/auth/me
// ============================================
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ============================================
// PUT /api/auth/me
// ============================================
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(2).optional(),
      avatarUrl: z.string().url().optional(),
    });

    const data = updateSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
