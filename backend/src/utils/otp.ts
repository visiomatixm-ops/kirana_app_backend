import nodemailer from 'nodemailer';
import { env } from '../config/env';
import twilio from 'twilio';



// Store OTPs in memory (use Redis in production)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// Email transporter setup
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS EXISTS =", !!process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

/**
 * Generate and send OTP to email
 */
export async function sendOtpToEmail(email: string): Promise<string> {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with 10 minute expiry
  otpStore.set(email, {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  // Send email
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Login - Kirana Enterprise',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email</h2>
          <p>Your One-Time Password (OTP) is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="letter-spacing: 5px; color: #1e40af;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    console.log(`OTP sent to ${email}: ${otp}`);
    return otp;
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    throw new Error('Failed to send OTP email');
  }
}

/**
 * Generate and send OTP to phone (SMS - requires Twilio or similar)
 */
console.log("TWILIO FUNCTION CALLED");
export async function sendOtpToPhone(
  phone: string
): Promise<string> {

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  otpStore.set(phone, {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const formattedPhone =
    phone.startsWith("+")
      ? phone
      : `+91${phone}`;

  try {

    const message =
      await twilioClient.messages.create({
        body: `Your OTP for Kirana Enterprise is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: formattedPhone,
      });

    console.log("SMS SID:", message.sid);
    console.log("SMS STATUS:", message.status);

    return otp;

  } catch (err) {

    console.error(
      "Twilio SMS Error:",
      err
    );

    throw new Error(
      "Failed to send OTP SMS"
    );
  }
}

/**
 * Verify OTP
 */
export function verifyOtp(contact: string, code: string): boolean {
  const stored = otpStore.get(contact);
  
  if (!stored) {
    return false;
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(contact);
    return false;
  }
  
  if (stored.code === code) {
    otpStore.delete(contact);
    return true;
  }
  
  return false;
}

/**
 * Clear all OTPs (for testing)
 */
export function clearAllOtps(): void {
  otpStore.clear();
}
