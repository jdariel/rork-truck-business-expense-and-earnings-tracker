import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PieChart, Calendar, List } from "lucide-react-native";
import { router } from "expo-router";
import { useBusiness } from "@/hooks/business-store";
import { getCategoryLabel, getCategoryIcon, EXPENSE_CATEGORIES } from "@/constants/categories";
import { Trip, Expense, ExpenseCategory } from "@/types/business";
import { useTheme } from "@/hooks/theme-store";

type TimePeriod = 'weekly' | 'monthly' | 'yearly';

export default function ReportsScreen() {
  const { getMonthlySummary, trips, expenses } = useBusiness();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const getWeekRange = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const sunday = new Date(date.setDate(diff));
    const saturday = new Date(date.setDate(diff + 6));
    return { start: sunday, end: saturday };
  };

  const getWeeklySummary = (date: Date) => {
    const { start, end } = getWeekRange(new Date(date));
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const weekTrips = trips.filter(trip => trip.date >= startStr && trip.date <= endStr);
    const weekExpenses = expenses.filter(expense => expense.date >= startStr && expense.date <= endStr);

    const totalEarnings = weekTrips.reduce((sum, trip) => sum + trip.earnings, 0);
    const tripExpenses = weekTrips.reduce((sum, trip) => 
      sum + (trip.fuelCost || 0) + (trip.otherExpenses || 0), 0);
    const otherExpenses = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalExpenses = tripExpenses + otherExpenses;

    const expensesByCategory: Record<string, number> = {};
    weekExpenses.forEach(expense => {
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
    });

    if (weekTrips.some(trip => trip.fuelCost)) {
      expensesByCategory.fuel = (expensesByCategory.fuel || 0) + 
        weekTrips.reduce((sum, trip) => sum + (trip.fuelCost || 0), 0);
    }

    return {
      totalEarnings,
      totalExpenses,
      netProfit: totalEarnings - totalExpenses,
      tripCount: weekTrips.length,
      expensesByCategory,
    };
  };

  const getYearlySummary = (year: number) => {
    const yearStr = year.toString();
    const yearTrips = trips.filter(trip => trip.date.startsWith(yearStr));
    const yearExpenses = expenses.filter(expense => expense.date.startsWith(yearStr));

    const totalEarnings = yearTrips.reduce((sum, trip) => sum + trip.earnings, 0);
    const tripExpenses = yearTrips.reduce((sum, trip) => 
      sum + (trip.fuelCost || 0) + (trip.otherExpenses || 0), 0);
    const otherExpenses = yearExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalExpenses = tripExpenses + otherExpenses;

    const expensesByCategory: Record<string, number> = {};
    yearExpenses.forEach(expense => {
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
    });

    if (yearTrips.some(trip => trip.fuelCost)) {
      expensesByCategory.fuel = (expensesByCategory.fuel || 0) + 
        yearTrips.reduce((sum, trip) => sum + (trip.fuelCost || 0), 0);
    }

    return {
      totalEarnings,
      totalExpenses,
      netProfit: totalEarnings - totalExpenses,
      tripCount: yearTrips.length,
      expensesByCategory,
      yearTrips,
      yearExpenses,
    };
  };

  const currentSummary = useMemo(() => {
    if (timePeriod === 'weekly') {
      return getWeeklySummary(selectedDate);
    } else if (timePeriod === 'yearly') {
      return getYearlySummary(selectedDate.getFullYear());
    } else {
      return getMonthlySummary(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
    }
  }, [selectedDate, timePeriod, getMonthlySummary, trips, expenses]);

  const changePeriod = (direction: number) => {
    const newDate = new Date(selectedDate);
    if (timePeriod === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (timePeriod === 'monthly') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setSelectedDate(newDate);
  };

  const periodLabel = useMemo(() => {
    if (timePeriod === 'weekly') {
      const { start, end } = getWeekRange(new Date(selectedDate));
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (timePeriod === 'yearly') {
      return selectedDate.getFullYear().toString();
    } else {
      return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }, [selectedDate, timePeriod]);

  const previousSummary = useMemo(() => {
    const prevDate = new Date(selectedDate);
    if (timePeriod === 'weekly') {
      prevDate.setDate(prevDate.getDate() - 7);
      return getWeeklySummary(prevDate);
    } else if (timePeriod === 'yearly') {
      prevDate.setFullYear(prevDate.getFullYear() - 1);
      return getYearlySummary(prevDate.getFullYear());
    } else {
      prevDate.setMonth(prevDate.getMonth() - 1);
      return getMonthlySummary(prevDate.getFullYear(), prevDate.getMonth() + 1);
    }
  }, [selectedDate, timePeriod, getMonthlySummary, trips, expenses]);

  const earningsChange = previousSummary.totalEarnings > 0 
    ? ((currentSummary.totalEarnings - previousSummary.totalEarnings) / previousSummary.totalEarnings) * 100
    : 0;

  const expensesChange = previousSummary.totalExpenses > 0
    ? ((currentSummary.totalExpenses - previousSummary.totalExpenses) / previousSummary.totalExpenses) * 100
    : 0;

  const previousPeriodLabel = timePeriod === 'weekly' ? 'last week' : timePeriod === 'yearly' ? 'last year' : 'last month';

  const topCategories = useMemo(() => {
    return Object.entries(currentSummary.expensesByCategory)
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [currentSummary]);

  const daysInPeriod = timePeriod === 'weekly' ? 7 : timePeriod === 'yearly' ? 365 : 30;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top, backgroundColor: theme.surface }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Time Period Selector */}
      <View style={[styles.periodTypeSelector, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.periodTypeButton, { backgroundColor: theme.background }, timePeriod === 'weekly' && styles.periodTypeButtonActive]}
          onPress={() => setTimePeriod('weekly')}
        >
          <Text style={[styles.periodTypeText, { color: theme.textSecondary }, timePeriod === 'weekly' && styles.periodTypeTextActive]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.periodTypeButton, { backgroundColor: theme.background }, timePeriod === 'monthly' && styles.periodTypeButtonActive]}
          onPress={() => setTimePeriod('monthly')}
        >
          <Text style={[styles.periodTypeText, { color: theme.textSecondary }, timePeriod === 'monthly' && styles.periodTypeTextActive]}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.periodTypeButton, { backgroundColor: theme.background }, timePeriod === 'yearly' && styles.periodTypeButtonActive]}
          onPress={() => setTimePeriod('yearly')}
        >
          <Text style={[styles.periodTypeText, { color: theme.textSecondary }, timePeriod === 'yearly' && styles.periodTypeTextActive]}>Yearly</Text>
        </TouchableOpacity>
      </View>

      {/* Period Navigation */}
      <View style={[styles.monthSelector, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => changePeriod(-1)} style={styles.monthButton}>
          <ChevronLeft size={24} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.periodLabelContainer}>
          <Calendar size={18} color={theme.textSecondary} />
          <Text style={[styles.monthText, { color: theme.text }]}>{periodLabel}</Text>
        </View>
        <TouchableOpacity onPress={() => changePeriod(1)} style={styles.monthButton}>
          <ChevronRight size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <View style={[styles.summaryCard, { backgroundColor: theme.card }, styles.earningsCard]}>
          <View style={styles.cardHeader}>
            <TrendingUp size={24} color="#10b981" />
            <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Total Earnings</Text>
          </View>
          <Text style={[styles.cardValue, { color: theme.text }]}>{formatCurrency(currentSummary.totalEarnings)}</Text>
          {earningsChange !== 0 && (
            <Text style={[
              styles.changeText,
              earningsChange > 0 ? styles.positiveChange : styles.negativeChange
            ]}>
              {earningsChange > 0 ? '+' : ''}{earningsChange.toFixed(1)}% from {previousPeriodLabel}
            </Text>
          )}
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.card }, styles.expensesCard]}>
          <View style={styles.cardHeader}>
            <TrendingDown size={24} color="#ef4444" />
            <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Total Expenses</Text>
          </View>
          <Text style={[styles.cardValue, { color: theme.text }]}>{formatCurrency(currentSummary.totalExpenses)}</Text>
          {expensesChange !== 0 && (
            <Text style={[
              styles.changeText,
              expensesChange < 0 ? styles.positiveChange : styles.negativeChange
            ]}>
              {expensesChange > 0 ? '+' : ''}{expensesChange.toFixed(1)}% from {previousPeriodLabel}
            </Text>
          )}
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.card }, styles.profitCard]}>
          <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Net Profit</Text>
          <Text style={[
            styles.cardValue,
            styles.profitValue,
            currentSummary.netProfit < 0 && styles.negativeProfit
          ]}>
            {formatCurrency(currentSummary.netProfit)}
          </Text>
          <Text style={[styles.profitMargin, { color: theme.textSecondary }]}>
            {currentSummary.totalEarnings > 0 
              ? `${((currentSummary.netProfit / currentSummary.totalEarnings) * 100).toFixed(1)}% margin`
              : 'No earnings'}
          </Text>
        </View>
      </View>

      {/* Trip Statistics */}
      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Trip Statistics</Text>
        <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
          <View style={[styles.statRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Trips</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{currentSummary.tripCount}</Text>
          </View>
          <View style={[styles.statRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Average per Trip</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {currentSummary.tripCount > 0 
                ? formatCurrency(currentSummary.totalEarnings / currentSummary.tripCount)
                : '$0.00'}
            </Text>
          </View>
          <View style={[styles.statRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Daily Average</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatCurrency(currentSummary.totalEarnings / daysInPeriod)}
            </Text>
          </View>
        </View>
      </View>

      {/* Expense Breakdown */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <PieChart size={20} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Expense Breakdown</Text>
        </View>
        
        {topCategories.length > 0 ? (
          <View style={[styles.categoriesCard, { backgroundColor: theme.card }]}>
            {topCategories.map(([category, amount]) => {
              const percentage = (amount / currentSummary.totalExpenses) * 100;
              return (
                <View key={category} style={[styles.categoryRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryIcon}>
                      {getCategoryIcon(category as any)}
                    </Text>
                    <Text style={[styles.categoryName, { color: theme.text }]}>
                      {getCategoryLabel(category as any)}
                    </Text>
                  </View>
                  <View style={styles.categoryAmount}>
                    <Text style={[styles.categoryValue, { color: theme.text }]}>{formatCurrency(amount)}</Text>
                    <Text style={[styles.categoryPercentage, { color: theme.textSecondary }]}>{percentage.toFixed(1)}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyCategory, { backgroundColor: theme.card }]}>
            <Text style={[styles.emptyCategoryText, { color: theme.textSecondary }]}>No expenses this {timePeriod === 'weekly' ? 'week' : timePeriod === 'yearly' ? 'year' : 'month'}</Text>
          </View>
        )}
      </View>

      {/* Yearly Transactions List */}
      {timePeriod === 'yearly' && (
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <List size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>All Transactions</Text>
          </View>
          
          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoryFilterScroll}
            contentContainerStyle={styles.categoryFilterContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryFilterButton,
                { backgroundColor: theme.background, borderColor: theme.border },
                selectedCategory === 'all' && styles.categoryFilterButtonActive
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[
                styles.categoryFilterText,
                { color: theme.textSecondary },
                selectedCategory === 'all' && styles.categoryFilterTextActive
              ]}>All</Text>
            </TouchableOpacity>
            {EXPENSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryFilterButton,
                  { backgroundColor: theme.background, borderColor: theme.border },
                  selectedCategory === cat.value && styles.categoryFilterButtonActive
                ]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Text style={styles.categoryFilterIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryFilterText,
                  { color: theme.textSecondary },
                  selectedCategory === cat.value && styles.categoryFilterTextActive
                ]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {(() => {
            const yearTrips = (currentSummary as any).yearTrips || [];
            const yearExpenses = (currentSummary as any).yearExpenses || [];
            
            type Transaction = {
              id: string;
              date: string;
              type: 'trip' | 'expense';
              description: string;
              amount: number;
              isEarning: boolean;
            };
            
            const allTransactions: Transaction[] = [
              ...(selectedCategory === 'all' ? yearTrips.map((trip: Trip) => ({
                id: trip.id,
                date: trip.date,
                type: 'trip' as const,
                description: trip.routeName,
                amount: trip.earnings,
                isEarning: true,
                category: undefined,
              })) : []),
              ...yearExpenses
                .filter((expense: Expense) => selectedCategory === 'all' || expense.category === selectedCategory)
                .map((expense: Expense) => ({
                  id: expense.id,
                  date: expense.date,
                  type: 'expense' as const,
                  description: expense.description,
                  amount: expense.amount,
                  isEarning: false,
                  category: expense.category,
                })),
            ].sort((a, b) => b.date.localeCompare(a.date));
            
            return allTransactions.length > 0 ? (
              <View style={[styles.transactionsCard, { backgroundColor: theme.card }]}>
                {allTransactions.map((transaction) => (
                  <TouchableOpacity 
                    key={transaction.id} 
                    style={[styles.transactionRow, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      if (transaction.type === 'trip') {
                        router.push(`/trip-details?id=${transaction.id}`);
                      } else {
                        router.push(`/expense-details?id=${transaction.id}`);
                      }
                    }}
                  >
                    <View style={styles.transactionLeft}>
                      <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
                        {new Date(transaction.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                      <Text style={[styles.transactionDescription, { color: theme.text }]}>
                        {transaction.description}
                      </Text>
                      <Text style={[styles.transactionType, { color: theme.textSecondary }]}>
                        {transaction.type === 'trip' ? 'Trip Earning' : 'Expense'}
                      </Text>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      transaction.isEarning ? styles.earningAmount : styles.expenseAmount
                    ]}>
                      {transaction.isEarning ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyCategory, { backgroundColor: theme.card }]}>
                <Text style={[styles.emptyCategoryText, { color: theme.textSecondary }]}>No transactions this year</Text>
              </View>
            );
          })()}
        </View>
      )}

      <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  periodTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  periodTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  periodTypeButtonActive: {
    backgroundColor: '#1e40af',
  },
  periodTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodTypeTextActive: {
    color: '#fff',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  periodLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  summarySection: {
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  earningsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  expensesCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  profitCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profitValue: {
    color: '#10b981',
  },
  negativeProfit: {
    color: '#ef4444',
  },
  changeText: {
    fontSize: 12,
    marginTop: 4,
  },
  positiveChange: {
    color: '#10b981',
  },
  negativeChange: {
    color: '#ef4444',
  },
  profitMargin: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoriesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 14,
    color: '#1f2937',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyCategory: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  bottomPadding: {
    height: 20,
  },
  transactionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionLeft: {
    flex: 1,
    gap: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  transactionDescription: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  transactionType: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  earningAmount: {
    color: '#10b981',
  },
  expenseAmount: {
    color: '#ef4444',
  },
  categoryFilterScroll: {
    marginBottom: 16,
  },
  categoryFilterContent: {
    gap: 8,
    paddingRight: 16,
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryFilterButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  categoryFilterIcon: {
    fontSize: 16,
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryFilterTextActive: {
    color: '#fff',
  },
});