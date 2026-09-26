import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/authController.js';

const router = Router();

// Phase 2: Onboarding & Profile routes
router.get('/profile', getProfile);
router.post('/profile', updateProfile);
router.put('/profile', updateProfile);

export default router;
