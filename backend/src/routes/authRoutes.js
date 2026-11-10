import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  sendOtp,
  verifyOtp,
  socialAuth,
  getProfile,
  updateProfile,
  setMpin,
  verifyMpin,
  emailAuth,
  sendEmailOtp,
  verifyEmailOtp,
  completeOnboarding,
  refresh,
  logout,
} from '../controllers/authController.js';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/social', socialAuth);
router.post('/email', emailAuth);
router.post('/send-email-otp', sendEmailOtp);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/complete-onboarding', completeOnboarding);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/profile', requireAuth, getProfile);
router.post('/profile', requireAuth, updateProfile);
router.post('/mpin/set', setMpin);
router.post('/mpin/verify', verifyMpin);

export default router;
