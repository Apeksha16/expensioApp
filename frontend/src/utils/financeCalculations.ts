import type { ExpenseItem, SplitItem, PaymentItem } from '../types';

/**
 * All monetary values are handled in cents/paise internally to avoid floating-point errors.
 * E.g. ₹10.50 is stored as 1050.
 */

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return paise / 100;
}

export interface FinanceState {
  transactions: ExpenseItem[];
  splits: SplitItem[];
  payments: PaymentItem[];
  salaryLimit: number; // in paise
}

export function calculateSalarySummary(state: FinanceState) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let spentThisMonth = 0;

  state.transactions.forEach((tx) => {
    const txDate = new Date(tx.date);
    if (
      tx.account === 'salary' &&
      tx.type !== 'income' &&
      txDate.getMonth() === currentMonth &&
      txDate.getFullYear() === currentYear
    ) {
      let expensePaise = toPaise(tx.amount);

      // Check if there's a split associated with this transaction where YOU paid
      const associatedSplit = state.splits.find(s => s.transactionId === tx.id);
      if (associatedSplit && associatedSplit.paidBy === 'YOU' && associatedSplit.youGet) {
        expensePaise -= toPaise(associatedSplit.youGet); // Only my portion is an expense
      }

      // If someone else paid, I haven't actually spent from my account until settlement
      if (associatedSplit && associatedSplit.paidBy !== 'YOU') {
        expensePaise = 0; // The other person paid it directly
      }

      spentThisMonth += expensePaise;
    }
  });

  return {
    salaryLimit: state.salaryLimit,
    spentThisMonth,
    remaining: state.salaryLimit - spentThisMonth,
  };
}

export function calculateCashSummary(state: FinanceState) {
  let cashIncome = 0;
  let cashSpent = 0;

  state.transactions.forEach((tx) => {
    if (tx.account === 'cash') {
      if (tx.type === 'income') {
        cashIncome += toPaise(tx.amount);
      } else {
        let expensePaise = toPaise(tx.amount);
        const associatedSplit = state.splits.find(s => s.transactionId === tx.id);
        if (associatedSplit && associatedSplit.paidBy === 'YOU' && associatedSplit.youGet) {
          expensePaise -= toPaise(associatedSplit.youGet);
        }
        if (associatedSplit && associatedSplit.paidBy !== 'YOU') {
          expensePaise = 0;
        }
        cashSpent += expensePaise;
      }
    }
  });

  return {
    cashIncome,
    cashSpent,
    cashBalance: cashIncome - cashSpent,
  };
}

export function calculateSavingsSummary(state: FinanceState) {
  let accumulated = 0;
  let recentPeriodNet = 0;
  let previousPeriodNet = 0;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(thirtyDaysAgo);
  sixtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  state.transactions.forEach((tx) => {
    if (tx.account === 'savings') {
      const txDate = new Date(tx.date);
      let netImpact = 0;

      if (tx.type === 'income') {
        netImpact = toPaise(tx.amount);
      } else {
        let expensePaise = toPaise(tx.amount);
        const associatedSplit = state.splits.find(s => s.transactionId === tx.id);
        if (associatedSplit && associatedSplit.paidBy === 'YOU' && associatedSplit.youGet) {
          expensePaise -= toPaise(associatedSplit.youGet);
        }
        if (associatedSplit && associatedSplit.paidBy !== 'YOU') {
          expensePaise = 0;
        }
        netImpact = -expensePaise;
      }

      accumulated += netImpact;

      if (txDate >= thirtyDaysAgo) {
        recentPeriodNet += netImpact;
      } else if (txDate >= sixtyDaysAgo && txDate < thirtyDaysAgo) {
        previousPeriodNet += netImpact;
      }
    }
  });

  let growthStatus: 'growing' | 'shrinking' | 'neutral' = 'neutral';
  if (recentPeriodNet > previousPeriodNet) {
    growthStatus = 'growing';
  } else if (recentPeriodNet < previousPeriodNet) {
    growthStatus = 'shrinking';
  }

  return {
    totalSavings: accumulated, // sum of all savings contributions - withdrawals
    accumulated,
    growthStatus,
  };
}

export function calculateSplitSummary(state: FinanceState) {
  let youllGet = 0;
  let youOwe = 0;
  const balances: Record<string, number> = {};

  state.splits.forEach((split) => {
    if (split.status === 'SETTLED') return;

    if (split.paidBy === 'YOU' && split.youGet) {
      if (split.participants && split.participants.length > 0) {
        // Distribute youGet among participants if shares exist, otherwise equally
        split.participants.forEach((p) => {
          let pShare = 0;
          if (split.shares && split.shares[p] !== undefined) {
            pShare = toPaise(split.shares[p]);
          } else {
            pShare = Math.floor(toPaise(split.youGet!) / split.participants!.length);
          }
          balances[p] = (balances[p] || 0) + pShare;
        });
      }
    } else if (split.paidBy !== 'YOU' && split.youOwe) {
      const p = split.paidBy;
      const amountOwed = toPaise(split.youOwe);
      balances[p] = (balances[p] || 0) - amountOwed;
    }
  });

  const peopleBalances: { name: string; balance: number }[] = [];
  let getPeopleCount = 0;
  let owePeopleCount = 0;

  Object.entries(balances).forEach(([name, balance]) => {
    if (balance > 0) {
      youllGet += balance;
      getPeopleCount++;
      peopleBalances.push({ name, balance: toRupees(balance) });
    } else if (balance < 0) {
      youOwe += Math.abs(balance);
      owePeopleCount++;
      peopleBalances.push({ name, balance: toRupees(balance) });
    }
  });

  return {
    youllGet: toRupees(youllGet),
    youOwe: toRupees(youOwe),
    getPeopleCount,
    owePeopleCount,
    peopleBalances: peopleBalances.sort((a, b) => b.balance - a.balance),
  };
}

export function calculateDashboardSummary(state: FinanceState) {
  const salary = calculateSalarySummary(state);
  const cash = calculateCashSummary(state);
  const savings = calculateSavingsSummary(state);
  const splits = calculateSplitSummary(state);

  const totalBalance = salary.remaining + cash.cashBalance + savings.accumulated;

  return {
    salary,
    cash,
    savings,
    splits,
    totalBalance,
  };
}
