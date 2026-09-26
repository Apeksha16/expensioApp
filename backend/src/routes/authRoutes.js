import { Router } from 'express';
import {
  sendOtp,
  verifyOtp,
  socialAuth,
  getProfile,
  updateProfile,
  setMpin,
  verifyMpin,
} from '../controllers/authController.js';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/social', socialAuth);
router.get('/profile', getProfile);
router.post('/profile', updateProfile);
router.post('/mpin/set', setMpin);
router.post('/mpin/verify', verifyMpin);

export default router;
