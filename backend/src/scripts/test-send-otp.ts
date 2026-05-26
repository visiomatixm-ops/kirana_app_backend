import 'dotenv/config';
import { sendOtpToEmail } from '../utils/otp';

async function main() {
  const email = process.argv[2] || process.env.TEST_EMAIL;
  if (!email) {
    console.error('Usage: npx tsx src/scripts/test-send-otp.ts you@example.com');
    process.exit(1);
  }

  try {
    const otp = await sendOtpToEmail(email);
    console.log(`Sent OTP to ${email}: ${otp}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to send OTP:', err);
    process.exit(1);
  }
}

main();
