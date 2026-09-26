import { Router } from 'express';
import { getSplits, settleSplit } from '../controllers/splitController.js';

const router = Router();

router.get('/', getSplits);
router.post('/:id/settle', settleSplit);

export default router;
