import { Router } from 'express';
import { getSubscriptions, markSubscriptionPaid } from '../controllers/subscriptionController.js';

const router = Router();

router.get('/', getSubscriptions);
router.post('/:id/pay', markSubscriptionPaid);

export default router;
