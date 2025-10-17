import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo } from "react";
import { Calculator, DollarSign, FileText, TrendingDown } from "lucide-react-native";
import { useBusiness } from "@/hooks/business-store";
import { useTheme } from "@/hooks/theme-store";
import { router } from "expo-router";

const STANDARD_MILEAGE_RATE = 0.655;
const TAX_BRACKETS = [
  { min: 0, max: 11000, rate: 0.10 },
  { min: 11001, max: 44725, rate: 0.12 },
  { min: 44726, max: 95375, rate: 0.22 },
  { min: 95376, max: 182100, rate: 0.24 },
  { min: 182101, max: 231250, rate: 0.32 },
  { min: 231251, max: 578125, rate: 0.35 },
  { min: 578126, max: Infinity, rate: 0.37 },
];

export default function TaxEstimatorScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { trips, expenses } = useBusiness();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [estimatedMiles, setEstimatedMiles] = useState("");
  const [useStandardDeduction, setUseStandardDeduction] = useState(true);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const yearData = useMemo(() => {
    const yearStr = selectedYear.toString();
    const yearTrips = trips.filter(trip => trip.date.startsWith(yearStr));
    const yearExpenses = expenses.filter(expense => expense.date.startsWith(yearStr));

    const totalIncome = yearTrips.reduce((sum, trip) => sum + trip.earnings, 0);
    const totalExpenses = yearExpenses.reduce((sum, expense) => sum + expense.amount, 0) +
      yearTrips.reduce((sum, trip) => sum + (trip.fuelCost || 0) + (trip.otherExpenses || 0), 0);

    const miles = parseFloat(estimatedMiles) || 0;
    const standardMileageDeduction = miles * STANDARD_MILEAGE_RATE;
    
    const deductibleExpenses = useStandardDeduction 
      ? standardMileageDeduction 
      : totalExpenses;

    const netIncome = Math.max(0, totalIncome - deductibleExpenses);
    
    let estimatedTax = 0;
    let remainingIncome = netIncome;
    
    for (const bracket of TAX_BRACKETS) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(
        remainingIncome,
        bracket.max - bracket.min + 1
      );
      
      estimatedTax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    const quarterlyEstimate = estimatedTax / 4;

    return {
      totalIncome,
      totalExpenses,
      deductibleExpenses,
      netIncome,
      estimatedTax,
      quarterlyEstimate,
      effectiveRate: netIncome > 0 ? (estimatedTax / netIncome) * 100 : 0,
    };
  }, [trips, expenses, selectedYear, estimatedMiles, useStandardDeduction]);

  const expensesByCategory = useMemo(() => {
    const yearStr = selectedYear.toString();
    const yearExpenses = expenses.filter(expense => expense.date.startsWith(yearStr));
    
    const byCategory: Record<string, number> = {};
    yearExpenses.forEach(expense => {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
    });
    
    return Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  }, [expenses, selectedYear]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <ScrollView style={styles.content}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <Calculator size={32} color="#fff" />
          <Text style={styles.headerTitle}>Tax Estimator</Text>
          <Text style={styles.headerSubtitle}>Calculate your estimated taxes and deductions</Text>
        </View>

        <View style={styles.yearSelector}>
          {years.map(year => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                { backgroundColor: theme.card, borderColor: theme.border },
                selectedYear === year && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <Text style={[
                styles.yearButtonText,
                { color: theme.text },
                selectedYear === year && { color: '#fff', fontWeight: '600' }
              ]}>{year}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>Deduction Method</Text>
          <View style={styles.methodButtons}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                { backgroundColor: theme.background, borderColor: theme.border },
                useStandardDeduction && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => setUseStandardDeduction(true)}
            >
              <Text style={[
                styles.methodButtonText,
                { color: theme.text },
                useStandardDeduction && { color: '#fff', fontWeight: '600' }
              ]}>Standard Mileage</Text>
              <Text style={[
                styles.methodButtonSubtext,
                { color: theme.textSecondary },
                useStandardDeduction && { color: '#dbeafe' }
              ]}>${STANDARD_MILEAGE_RATE}/mile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.methodButton,
                { backgroundColor: theme.background, borderColor: theme.border },
                !useStandardDeduction && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => setUseStandardDeduction(false)}
            >
              <Text style={[
                styles.methodButtonText,
                { color: theme.text },
                !useStandardDeduction && { color: '#fff', fontWeight: '600' }
              ]}>Actual Expenses</Text>
              <Text style={[
                styles.methodButtonSubtext,
                { color: theme.textSecondary },
                !useStandardDeduction && { color: '#dbeafe' }
              ]}>Detailed tracking</Text>
            </TouchableOpacity>
          </View>

          {useStandardDeduction && (
            <View style={styles.milesInput}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Estimated Business Miles:</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={estimatedMiles}
                onChangeText={setEstimatedMiles}
                keyboardType="numeric"
                placeholder="Enter miles driven"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          )}
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <View style={styles.summaryHeader}>
            <DollarSign size={24} color={theme.primary} />
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Tax Summary</Text>
          </View>

          <View style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Income</Text>
            <Text style={[styles.summaryValue, { color: theme.success }]}>{formatCurrency(yearData.totalIncome)}</Text>
          </View>

          <View style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Deductions</Text>
            <Text style={[styles.summaryValue, { color: theme.danger }]}>-{formatCurrency(yearData.deductibleExpenses)}</Text>
          </View>

          <View style={[styles.summaryRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.summaryLabel, { color: theme.text }]}>Taxable Income</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(yearData.netIncome)}</Text>
          </View>

          <View style={[styles.summaryRow, styles.highlightRow, { backgroundColor: theme.background }]}>
            <Text style={[styles.summaryLabel, styles.highlightLabel, { color: theme.text }]}>Estimated Tax</Text>
            <Text style={[styles.summaryValue, styles.highlightValue, { color: theme.primary }]}>{formatCurrency(yearData.estimatedTax)}</Text>
          </View>

          <View style={styles.rateInfo}>
            <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>Effective Tax Rate:</Text>
            <Text style={[styles.rateValue, { color: theme.primary }]}>{yearData.effectiveRate.toFixed(1)}%</Text>
          </View>
        </View>

        <View style={[styles.quarterlyCard, { backgroundColor: theme.card }]}>
          <View style={styles.quarterlyHeader}>
            <FileText size={20} color={theme.primary} />
            <Text style={[styles.quarterlyTitle, { color: theme.text }]}>Quarterly Estimates</Text>
          </View>
          <Text style={[styles.quarterlySubtitle, { color: theme.textSecondary }]}>
            Pay these amounts each quarter to avoid penalties
          </Text>
          
          <View style={styles.quarterlyGrid}>
            {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, index) => (
              <View key={quarter} style={[styles.quarterCard, { backgroundColor: theme.background }]}>
                <Text style={[styles.quarterLabel, { color: theme.textSecondary }]}>{quarter}</Text>
                <Text style={[styles.quarterValue, { color: theme.primary }]}>{formatCurrency(yearData.quarterlyEstimate)}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.dueDatesNote, { color: theme.textSecondary }]}>
            Due dates: Apr 15, Jun 15, Sep 15, Jan 15
          </Text>
        </View>

        <View style={[styles.expensesCard, { backgroundColor: theme.card }]}>
          <View style={styles.expensesHeader}>
            <TrendingDown size={20} color={theme.danger} />
            <Text style={[styles.expensesTitle, { color: theme.text }]}>Deductible Expenses</Text>
          </View>
          {expensesByCategory.length > 0 ? (
            expensesByCategory.map(([category, amount]) => (
              <View key={category} style={[styles.expenseRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.expenseCategory, { color: theme.text }]}>{category}</Text>
                <Text style={[styles.expenseAmount, { color: theme.danger }]}>{formatCurrency(amount)}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noExpenses, { color: theme.textSecondary }]}>
              No expenses recorded for {selectedYear}
            </Text>
          )}
        </View>

        <View style={[styles.disclaimerCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={[styles.disclaimerTitle, { color: theme.text }]}>⚠️ Important Notice</Text>
          <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
            This is an estimate only. Actual tax liability may vary. Consult with a tax professional for accurate tax planning and filing. This calculator uses 2024 federal tax brackets and does not include state taxes, self-employment tax, or other deductions.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.exportButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/reports')}
        >
          <Text style={styles.exportButtonText}>View Detailed Reports</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    marginTop: 4,
    textAlign: 'center',
  },
  yearSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  yearButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  yearButtonText: {
    fontSize: 16,
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  methodButtonSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  milesInput: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  highlightRow: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  highlightLabel: {
    fontWeight: '600',
  },
  highlightValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rateInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  rateLabel: {
    fontSize: 13,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  quarterlyCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  quarterlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  quarterlyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quarterlySubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  quarterlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quarterCard: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quarterLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  quarterValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dueDatesNote: {
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
  expensesCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  expensesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  expensesTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  expenseCategory: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  noExpenses: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  disclaimerCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  exportButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});
