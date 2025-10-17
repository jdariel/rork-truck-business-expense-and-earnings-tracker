import { Trip, Expense } from '@/types/business';
import { FuelEntry } from '@/types/fuel';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ExportFormat = 'csv' | 'json';
export type ExportType = 'trips' | 'expenses' | 'fuel' | 'all';

interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  startDate?: string;
  endDate?: string;
  truckId?: string;
}

export class DataExporter {
  private formatCurrency(amount: number): string {
    return amount.toFixed(2);
  }

  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US');
  }

  private escapeCSV(value: string | number | undefined | null): string {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private tripsToCSV(trips: Trip[]): string {
    const headers = [
      'Date',
      'Route Name',
      'Trailer Number',
      'Earnings',
      'Fuel Cost',
      'Other Expenses',
      'Net Profit',
      'Notes'
    ];

    const rows = trips.map(trip => [
      this.escapeCSV(this.formatDate(trip.date)),
      this.escapeCSV(trip.routeName),
      this.escapeCSV(trip.trailerNumber),
      this.formatCurrency(trip.earnings),
      this.formatCurrency(trip.fuelCost || 0),
      this.formatCurrency(trip.otherExpenses || 0),
      this.formatCurrency(trip.earnings - (trip.fuelCost || 0) - (trip.otherExpenses || 0)),
      this.escapeCSV(trip.notes)
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private expensesToCSV(expenses: Expense[]): string {
    const headers = [
      'Date',
      'Category',
      'Description',
      'Amount',
      'Receipt',
      'Notes'
    ];

    const rows = expenses.map(expense => [
      this.escapeCSV(this.formatDate(expense.date)),
      this.escapeCSV(expense.category),
      this.escapeCSV(expense.description),
      this.formatCurrency(expense.amount),
      expense.receiptImage ? 'Yes' : 'No',
      this.escapeCSV(expense.notes)
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private fuelToCSV(fuelEntries: FuelEntry[]): string {
    const headers = [
      'Date',
      'Truck ID',
      'Gallons',
      'Price Per Gallon',
      'Total Cost',
      'Odometer',
      'MPG',
      'Location',
      'Fill-Up',
      'Notes'
    ];

    const rows = fuelEntries.map(entry => [
      this.escapeCSV(this.formatDate(entry.date)),
      this.escapeCSV(entry.truckId),
      entry.gallons.toFixed(2),
      this.formatCurrency(entry.pricePerGallon),
      this.formatCurrency(entry.totalCost),
      entry.odometer.toString(),
      entry.mpg ? entry.mpg.toFixed(2) : '',
      this.escapeCSV(entry.location),
      entry.isFillUp ? 'Yes' : 'No',
      this.escapeCSV(entry.notes)
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  async exportData(
    options: ExportOptions,
    data: {
      trips?: Trip[];
      expenses?: Expense[];
      fuelEntries?: FuelEntry[];
    }
  ): Promise<{ success: boolean; message: string; uri?: string }> {
    try {
      let content = '';
      let filename = '';

      const dateRange = options.startDate && options.endDate 
        ? `_${options.startDate}_to_${options.endDate}`
        : '';

      if (options.format === 'csv') {
        switch (options.type) {
          case 'trips':
            content = this.tripsToCSV(data.trips || []);
            filename = `rork_trips${dateRange}.csv`;
            break;
          case 'expenses':
            content = this.expensesToCSV(data.expenses || []);
            filename = `rork_expenses${dateRange}.csv`;
            break;
          case 'fuel':
            content = this.fuelToCSV(data.fuelEntries || []);
            filename = `rork_fuel${dateRange}.csv`;
            break;
          case 'all':
            const allData = [
              '=== TRIPS ===\n',
              this.tripsToCSV(data.trips || []),
              '\n\n=== EXPENSES ===\n',
              this.expensesToCSV(data.expenses || []),
              '\n\n=== FUEL ===\n',
              this.fuelToCSV(data.fuelEntries || [])
            ].join('');
            content = allData;
            filename = `rork_complete_export${dateRange}.csv`;
            break;
        }
      } else {
        content = JSON.stringify(data, null, 2);
        filename = `rork_export${dateRange}.json`;
      }

      if (Platform.OS === 'web') {
        const blob = new Blob([content], { 
          type: options.format === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return {
          success: true,
          message: 'File downloaded successfully'
        };
      } else {
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: options.format === 'csv' ? 'text/csv' : 'application/json',
            dialogTitle: 'Export Rork Data'
          });
        }

        return {
          success: true,
          message: 'File exported successfully',
          uri: fileUri
        };
      }
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        message: 'Failed to export data. Please try again.'
      };
    }
  }

  generateSummaryReport(
    trips: Trip[],
    expenses: Expense[],
    startDate?: string,
    endDate?: string
  ): string {
    const totalEarnings = trips.reduce((sum, trip) => sum + trip.earnings, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0) +
      trips.reduce((sum, trip) => sum + (trip.fuelCost || 0) + (trip.otherExpenses || 0), 0);
    const netProfit = totalEarnings - totalExpenses;

    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(expense => {
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
    });

    const period = startDate && endDate 
      ? `${this.formatDate(startDate)} to ${this.formatDate(endDate)}`
      : 'All Time';

    return `
RORK TRUCK BUSINESS SUMMARY REPORT
Period: ${period}
Generated: ${new Date().toLocaleString()}

=====================================
FINANCIAL SUMMARY
=====================================
Total Earnings:     $${this.formatCurrency(totalEarnings)}
Total Expenses:     $${this.formatCurrency(totalExpenses)}
Net Profit:         $${this.formatCurrency(netProfit)}
Profit Margin:      ${totalEarnings > 0 ? ((netProfit / totalEarnings) * 100).toFixed(1) : 0}%

=====================================
TRIP STATISTICS
=====================================
Total Trips:        ${trips.length}
Average Per Trip:   $${trips.length > 0 ? this.formatCurrency(totalEarnings / trips.length) : '0.00'}

=====================================
EXPENSE BREAKDOWN
=====================================
${Object.entries(expensesByCategory)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amount]) => `${cat.padEnd(20)} $${this.formatCurrency(amount)}`)
  .join('\n')}

=====================================
This report is for informational purposes only.
Consult with a tax professional for tax advice.
    `.trim();
  }
}

export const dataExporter = new DataExporter();
