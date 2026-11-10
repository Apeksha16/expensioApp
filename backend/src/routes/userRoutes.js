import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Phase 2: Onboarding & Profile routes
router.get('/profile', requireAuth, getProfile);
router.post('/profile', requireAuth, updateProfile);
router.put('/profile', requireAuth, updateProfile);

export default router;
