export interface Route {
  id: string;
  name: string;
  payment: number;
  distance?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  routeId?: string;
  routeName: string;
  date: string;
  earnings: number;
  trailerNumber?: string;
  fuelCost?: number;
  otherExpenses?: number;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  notes?: string;
  receiptImage?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'fuel'
  | 'maintenance'
  | 'insurance'
  | 'permits'
  | 'tolls'
  | 'parking'
  | 'food'
  | 'lodging'
  | 'repairs'
  | 'tires'
  | 'other';

export interface DailySummary {
  date: string;
  totalEarnings: number;
  totalExpenses: number;
  netProfit: number;
  trips: Trip[];
  expenses: Expense[];
}

export interface MonthlySummary {
  month: string;
  year: number;
  totalEarnings: number;
  totalExpenses: number;
  netProfit: number;
  tripCount: number;
  expensesByCategory: Record<ExpenseCategory, number>;
}