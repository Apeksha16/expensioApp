import { Router } from 'express';
import { registerPushToken, sendNotification } from '../controllers/notificationController.js';

const router = Router();

router.post('/register-token', registerPushToken);
router.post('/send', sendNotification);

export default router;
