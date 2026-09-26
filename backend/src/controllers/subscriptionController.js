import { db } from '../data/mockDatabase.js';

// GET /api/subscriptions
export const getSubscriptions = (req, res) => {
  const totalMonthly = db.subscriptions
    .filter((s) => s.period === 'this_month')
    .reduce((sum, s) => sum + s.amount, 0);

  res.json({
    success: true,
    totalMonthly,
    subscriptions: db.subscriptions,
  });
};

// POST /api/subscriptions/:id/pay
export const markSubscriptionPaid = (req, res) => {
  const { id } = req.params;
  const sub = db.subscriptions.find((s) => s.id === id);

  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  sub.isPaid = true;
  sub.dueStatus = 'PAID';

  res.json({
    success: true,
    message: 'Subscription marked as paid',
    subscription: sub,
  });
};
