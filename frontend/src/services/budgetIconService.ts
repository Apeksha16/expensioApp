import type { Ionicons } from '@expo/vector-icons';

export const budgetIconOptions: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'fast-food-outline', label: 'Food', icon: 'fast-food-outline' },
  { id: 'basket-outline', label: 'Groceries', icon: 'basket-outline' },
  { id: 'bag-handle-outline', label: 'Shopping', icon: 'bag-handle-outline' },
  { id: 'airplane-outline', label: 'Travel', icon: 'airplane-outline' },
  { id: 'car-outline', label: 'Transport', icon: 'car-outline' },
  { id: 'film-outline', label: 'Entertainment', icon: 'film-outline' },
  { id: 'medkit-outline', label: 'Healthcare', icon: 'medkit-outline' },
  { id: 'school-outline', label: 'Education', icon: 'school-outline' },
  { id: 'receipt-outline', label: 'Bills', icon: 'receipt-outline' },
  { id: 'home-outline', label: 'Rent', icon: 'home-outline' },
  { id: 'person-outline', label: 'Personal Care', icon: 'person-outline' },
  { id: 'ellipsis-horizontal-circle-outline', label: 'Others', icon: 'ellipsis-horizontal-circle-outline' },
];

export function getDefaultBudgetIconId(categoryName: string): string {
  const normalized = categoryName.toLowerCase();
  return budgetIconOptions.find((option) => option.label.toLowerCase() === normalized)?.id ?? 'pricetag-outline';
}
