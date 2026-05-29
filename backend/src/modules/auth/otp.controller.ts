import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { sendOtpToEmail, sendOtpToPhone, verifyOtp as verifyOtpUtil } from '../../utils/otp';
import { ok, fail } from '../../utils/response';
import { prisma } from '../../config/prisma';
import { signToken } from '../../utils/jwt';

export async function sendOtp(req: Request, res: Response) {
  console.log("SEND OTP BODY:", req.body);
  const { email, phone } = req.body;

  try {
    if (email) {
      await sendOtpToEmail(email);
      ok(res, { success: true, message: 'OTP sent to email' });
      return;
    }

    if (phone) {
      await sendOtpToPhone(phone);
      ok(res, { success: true, message: 'OTP sent to phone' });
      return;
    }

    fail(res, 'Provide email or phone to receive OTP');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send OTP';
    fail(res, message);
  }
}

// POST /api/auth/verify-otp
export async function verifyOtp(req: Request, res: Response) {
  const { email, phone, otp } = req.body as { email?: string; phone?: string; otp?: string };

  if (!otp) {
    fail(res, 'OTP is required');
    return;
  }

  try {
    const contact = email ?? phone;
    if (!contact) {
      fail(res, 'Email or phone is required');
      return;
    }

    const okVerify = verifyOtpUtil(contact, otp);
    if (!okVerify) {
      fail(res, 'Invalid or expired OTP', 400);
      return;
    }

    // Find existing user by phone field (we store email in phone for email-login)
    const existingUser = await prisma.user.findUnique({
      where: { phone: contact },
      select: { id: true, name: true, phone: true, role: true, avatarUrl: true, shopId: true },
    });

    let user = existingUser;
    if (!user) {
      // create a lightweight user record (random password)
      const passwordHash = await bcrypt.hash(
  Math.random().toString(36).slice(2),
  10
);
      user = await prisma.user.create({
        data: {
          name: contact.split('@')[0],
          phone: contact,
          passwordHash,
          role: 'OWNER',
        },
        select: { id: true, name: true, phone: true, role: true, avatarUrl: true, shopId: true },
      });
    }

    const token = signToken({ userId: user.id, shopId: user.shopId, role: user.role });

    // Return shopId so frontend can determine whether shop setup is complete
    return ok(res, {
      token,
      user: {
        id: user.id,
        email: user.phone,
        name: user.name,
        avatar: user.avatarUrl ?? null,
        shopId: user.shopId ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OTP verification failed';
    fail(res, message);
  }
}
