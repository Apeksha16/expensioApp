export const initialUser = {
  id: 'usr_001',
  name: 'Apeksha Verma',
  firstName: 'Apeksha',
  lastName: 'Verma',
  username: '@apeksha',
  phone: '9876543210',
  email: 'apeksha@expensio.app',
  recoveryEmail: 'apeksha@expensio.app',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=apeksha',
  mpin: '1234',
  customerType: 'Salaried',
  salary: 31627,
  cashBalance: 2500,
  savings: 0,
  failedMpinAttempts: 0,
  lockoutUntil: null,
};

export const db = {
  // Primary default user for backwards compatibility
  user: { ...initialUser },

  // User directory keyed by ID
  users: new Map([
    [initialUser.id, { ...initialUser }],
  ]),

  // OTP stores
  otps: new Map(), // phone -> { otp, expiresAt }
  emailOtps: new Map(), // email -> { otp, expiresAt, attempts }
  recoveryOtps: new Map(), // userId -> { otp, expiresAt, attempts, resetToken }

  pushTokens: new Set(),

  accounts: {
    salary: {
      id: 'acc_salary',
      title: 'Salary Account',
      badge: 'PRIMARY',
      remaining: 31169,
      spentThisMonth: 458,
      salaryLimit: 31627,
      currency: '₹',
    },
    cash: {
      id: 'acc_cash',
      title: 'Cash in Hand',
      badge: 'CASH',
      remaining: 2500,
      spentThisMonth: 340,
      startingCash: 2840,
      currency: '₹',
    },
    savings: {
      id: 'acc_savings',
      title: 'Savings Account',
      badge: 'SAVINGS',
      remaining: 0,
      growthStatus: 'Active ↗',
      accumulated: 0,
      currency: '₹',
    },
  },

  transactions: [
    { id: 'tx_1', title: 'zepto order', amount: 120.00, date: 'SEP 18, 11:40 PM', type: 'expense', method: 'UPI' },
    { id: 'tx_2', title: 'zepto order', amount: 68.67, date: 'SEP 18, 11:40 PM', type: 'expense', method: 'UPI' },
    { id: 'tx_3', title: 'Milk', amount: 12.50, date: 'SEP 18, 11:37 PM', type: 'expense', method: 'UPI' },
    { id: 'tx_4', title: 'Dahi', amount: 5.00, date: 'SEP 18, 11:35 PM', type: 'expense', method: 'UPI' },
    { id: 'tx_5', title: 'Dishwash Soap', amount: 1.67, date: 'SEP 18, 11:29 PM', type: 'expense', method: 'UPI' },
    { id: 'tx_6', title: 'Ice Cream', amount: 232.00, date: 'SEP 1, 1:20 PM', type: 'expense', method: 'UPI' },
  ],

  splits: {
    summary: {
      youllGet: 8774,
      fromPeople: 2,
      youOwe: 0,
      toPeople: 0,
    },
    expenses: [
      { id: 'sp_1', title: 'Meds', amount: 10000, date: 'SEP 17, 2:31 PM', paidBy: 'YOU', status: 'SETTLED' },
      { id: 'sp_2', title: 'Headphone', amount: 5000, date: 'SEP 17, 2:31 PM', paidBy: 'YOU', status: 'PENDING', youGet: 5000 },
      { id: 'sp_3', title: 'Monitor 2nd emi', amount: 4000, date: 'SEP 17, 2:29 PM', paidBy: 'YOU', status: 'PENDING', youGet: 4000 },
    ],
    groups: [
      { id: 'grp_1', title: 'Room GGN', members: 3, youOwe: 226, isArchived: true },
    ],
  },

  subscriptions: [
    { id: 'sub_1', title: 'Youtube Premium', amount: 50, dueStatus: 'OVERDUE BY 3 DAY(S)', isOverdue: true, period: 'this_month', isPaid: true },
    { id: 'sub_2', title: 'Netflix', amount: 130, dueStatus: 'DUE IN 2 DAY(S)', isOverdue: false, period: 'this_month', isPaid: true },
    { id: 'sub_3', title: 'Youtube Premium', amount: 50, dueStatus: 'DUE ON 22 OCT', isOverdue: false, period: 'next_month', isPaid: false },
    { id: 'sub_4', title: 'Netflix', amount: 130, dueStatus: 'DUE ON 27 OCT', isOverdue: false, period: 'next_month', isPaid: false },
  ],
};

// Helper function to find a user by identifier
export function findUserByIdentifier(identifier, type) {
  if (!identifier) return null;

  for (const user of db.users.values()) {
    if (type === 'phone') {
      const cleanTarget = identifier.replace(/\D/g, '').slice(-10);
      const cleanUser = (user.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanTarget && cleanUser && cleanTarget === cleanUser) {
        return user;
      }
    } else if (type === 'username') {
      const cleanTarget = identifier.replace(/^@/, '').trim().toLowerCase();
      const cleanUser = (user.username || '').replace(/^@/, '').trim().toLowerCase();
      if (cleanTarget && cleanUser && cleanTarget === cleanUser) {
        return user;
      }
    } else if (type === 'google') {
      const targetEmail = identifier.trim().toLowerCase();
      const userEmail = (user.email || '').trim().toLowerCase();
      if (targetEmail && userEmail && targetEmail === userEmail) {
        return user;
      }
    }
  }

  // Fallback to primary db.user if it matches
  if (type === 'phone') {
    const cleanTarget = identifier.replace(/\D/g, '').slice(-10);
    const cleanUser = (db.user.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanTarget === cleanUser) return db.user;
  } else if (type === 'username') {
    const cleanTarget = identifier.replace(/^@/, '').trim().toLowerCase();
    const cleanUser = (db.user.username || '').replace(/^@/, '').trim().toLowerCase();
    if (cleanTarget === cleanUser) return db.user;
  } else if (type === 'google') {
    if (identifier.toLowerCase() === (db.user.email || '').toLowerCase()) return db.user;
  }

  return null;
}

// Return safe user object omitting secrets
export function safeUser(user) {
  if (!user) return null;
  const { mpin, lockoutUntil, failedMpinAttempts, ...safe } = user;
  return safe;
}
