export type ExportFormat = 'pdf' | 'csv';

export type ExportType = 'trips' | 'expenses' | 'summary' | 'tax' | 'full';

export interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  startDate: string;
  endDate: string;
  includeSummary: boolean;
  includeCharts?: boolean;
  groupBy?: 'day' | 'week' | 'month';
  truckId?: string;
}

export interface ExportResult {
  success: boolean;
  uri?: string;
  error?: string;
  fileName: string;
  size: number;
}

export interface TaxReport {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  expensesByCategory: Record<string, number>;
  deductibleExpenses: number;
  estimatedTax: number;
  quarterlyEstimates: number[];
}
