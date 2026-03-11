import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { generateToken, setTokenCookie, authenticate } from '../middleware/auth.js';
import { sendEmail } from '../services/emailService.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Generate 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildVerifyEmailHtml({ name, code }) {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;direction:rtl;">
      <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:32px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🚗</div>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">אימות כתובת המייל שלך</h1>
        </div>
        <div style="padding:32px;text-align:center;">
          <p style="color:#374151;margin:0 0 8px;">שלום ${name},</p>
          <p style="color:#374151;margin:0 0 28px;">הזן את הקוד הבא כדי להשלים את ההרשמה:</p>
          <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:0 auto 28px;display:inline-block;min-width:180px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#4f46e5;">${code}</span>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:0;">הקוד תקף ל-15 דקות</p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">Car Service Tracker · מעקב טיפולים לרכב</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// POST /api/auth/register
// ============================================
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.isVerified) {
        return res.status(409).json({ error: 'Email already registered.' });
      }
      // Re-send verification code if not yet verified
      const code = generateCode();
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.user.update({
        where: { email },
        data: { verifyCode: code, verifyExpires: expires },
      });
      await sendEmail({
        to: email,
        subject: '🚗 קוד האימות שלך — Car Service Tracker',
        html: buildVerifyEmailHtml({ name: existing.name, code }),
      });
      return res.status(200).json({ message: 'Verification code resent.', needsVerification: true, email });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const code = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        isVerified: false,
        verifyCode: code,
        verifyExpires: expires,
      },
    });

    await sendEmail({
      to: email,
      subject: '🚗 קוד האימות שלך — Car Service Tracker',
      html: buildVerifyEmailHtml({ name, code }),
    });

    res.status(201).json({ message: 'Verification code sent.', needsVerification: true, email });
  } catch (err) {
    next(err);
  }
});

// ============================================
// POST /api/auth/verify
// ============================================
router.post('/verify', async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.isVerified) return res.status(400).json({ error: 'Already verified.' });
    if (user.verifyCode !== code) return res.status(400).json({ error: 'Invalid code.' });
    if (!user.verifyExpires || user.verifyExpires < new Date()) {
      return res.status(400).json({ error: 'Code expired. Please register again.' });
    }

    const verified = await prisma.user.update({
      where: { email },
      data: { isVerified: true, verifyCode: null, verifyExpires: null },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    const token = generateToken(verified.id);
    setTokenCookie(res, token);

    res.json({ user: verified, token });
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

    if (!user.isVerified) {
      // Resend code
      const code = generateCode();
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.user.update({
        where: { email },
        data: { verifyCode: code, verifyExpires: expires },
      });
      await sendEmail({
        to: email,
        subject: '🚗 קוד האימות שלך — Car Service Tracker',
        html: buildVerifyEmailHtml({ name: user.name, code }),
      });
      return res.status(403).json({ error: 'Email not verified.', needsVerification: true, email });
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
