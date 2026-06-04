/**
 * Auth Routes
 * POST /api/auth/register  — create new owner account + return JWT
 * POST /api/auth/login     — verify credentials + return JWT
 * GET  /api/auth/me        — return current user profile (protected)
 */

import { Router } from 'express';
import { upload } from '../../middleware/upload.middleware';
import {
  register,
  login,
  googleLogin,
  firebasePhoneLogin,
  me,
  uploadAvatar,
  removeAvatar
} from "./auth.controller";


import { sendOtp, verifyOtp } from './otp.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.post('/google',   googleLogin);
router.post("/firebase-phone", firebasePhoneLogin);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/me',        authenticate, me);  // only this route needs auth
router.post('/avatar',   authenticate, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', authenticate, removeAvatar);



export default router;
