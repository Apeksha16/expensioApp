import { db } from '../data/mockDatabase.js';

// GET /api/splits
export const getSplits = (req, res) => {
  res.json({
    success: true,
    splits: db.splits,
  });
};

// POST /api/splits/:id/settle
export const settleSplit = (req, res) => {
  const { id } = req.params;
  const expense = db.splits.expenses.find((e) => e.id === id);

  if (!expense) {
    return res.status(404).json({ error: 'Split expense not found' });
  }

  expense.status = 'SETTLED';
  if (expense.youGet) {
    db.splits.summary.youllGet = Math.max(0, db.splits.summary.youllGet - expense.youGet);
    delete expense.youGet;
  }

  res.json({
    success: true,
    message: 'Expense settled successfully',
    updatedExpense: expense,
    summary: db.splits.summary,
  });
};
