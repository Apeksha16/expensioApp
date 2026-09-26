import { db } from '../data/mockDatabase.js';

// GET /api/expenses/accounts
export const getAccounts = (req, res) => {
  res.json({
    success: true,
    accounts: db.accounts,
  });
};

// GET /api/expenses
export const getTransactions = (req, res) => {
  res.json({
    success: true,
    totalCount: db.transactions.length,
    transactions: db.transactions,
  });
};

// POST /api/expenses
export const addTransaction = (req, res) => {
  const { title, amount, method = 'UPI', account = 'salary' } = req.body;

  if (!title || !amount) {
    return res.status(400).json({ error: 'Title and amount are required' });
  }

  const numAmount = parseFloat(amount);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    `, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

  const newTx = {
    id: `tx_${Date.now()}`,
    title,
    amount: numAmount,
    date: dateStr,
    type: 'expense',
    method,
  };

  db.transactions.unshift(newTx);

  // Update account balance
  if (account === 'salary' && db.accounts.salary) {
    db.accounts.salary.remaining -= numAmount;
    db.accounts.salary.spentThisMonth += numAmount;
  } else if (account === 'cash' && db.accounts.cash) {
    db.accounts.cash.remaining -= numAmount;
    db.accounts.cash.spentThisMonth += numAmount;
  }

  res.status(201).json({
    success: true,
    message: 'Expense recorded successfully',
    transaction: newTx,
    updatedAccount: db.accounts[account],
  });
};
