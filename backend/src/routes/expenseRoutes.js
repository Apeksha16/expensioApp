import { Router } from 'express';
import { getAccounts, getTransactions, addTransaction } from '../controllers/expenseController.js';

const router = Router();

router.get('/accounts', getAccounts);
router.get('/', getTransactions);
router.post('/', addTransaction);

export default router;
