export const budgetCategories: string[] = [
  'Food',
  'Groceries',
  'Shopping',
  'Travel',
  'Transport',
  'Entertainment',
  'Healthcare',
  'Education',
  'Bills',
  'Rent',
  'Personal Care',
];

export function getBudgetCategoryId(category: string): string {
  return category.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function validateBudgetCategory(category: string): string {
  const normalized = category.trim();
  if (!normalized) throw new Error('Enter a budget category.');
  if (normalized.toLowerCase() === 'others') throw new Error('Others is reserved for unbudgeted expenses.');
  return normalized;
}
