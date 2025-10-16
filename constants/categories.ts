import { ExpenseCategory } from '@/types/business';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'fuel', label: 'Fuel', icon: '⛽' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'insurance', label: 'Insurance', icon: '📋' },
  { value: 'permits', label: 'Permits', icon: '📄' },
  { value: 'tolls', label: 'Tolls', icon: '🛣️' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'food', label: 'Food', icon: '🍔' },
  { value: 'lodging', label: 'Lodging', icon: '🏨' },
  { value: 'repairs', label: 'Repairs', icon: '🔨' },
  { value: 'tires', label: 'Tires', icon: '🛞' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export const getCategoryLabel = (category: ExpenseCategory): string => {
  return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || 'Other';
};

export const getCategoryIcon = (category: ExpenseCategory): string => {
  return EXPENSE_CATEGORIES.find(c => c.value === category)?.icon || '📦';
};