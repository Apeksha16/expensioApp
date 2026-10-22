import { Router } from 'express';
import {
  discoverAccount,
  verifyMpin,
  requestForgotMpinOtp,
  verifyForgotMpinOtp,
  resetMpin,
  sendEmailOtp,
  verifyEmailOtp,
  registerUser,
  socialAuth,
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile,
  setMpin,
} from '../controllers/authController.js';

const router = Router();

// Account Discovery
router.post('/discover', discoverAccount);

// MPIN Verification & Reset
router.post('/mpin/verify', verifyMpin);
router.post('/mpin/set', setMpin);

// Forgot MPIN Flow
router.post('/forgot-mpin/request-otp', requestForgotMpinOtp);
router.post('/forgot-mpin/verify-otp', verifyForgotMpinOtp);
router.post('/forgot-mpin/reset', resetMpin);

// Registration & Email Verification
router.post('/email/send-otp', sendEmailOtp);
router.post('/email/verify-otp', verifyEmailOtp);
router.post('/register', registerUser);

// Legacy Social & Phone Auth
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/social', socialAuth);

// Profile
router.get('/profile', getProfile);
router.post('/profile', updateProfile);

export default router;
