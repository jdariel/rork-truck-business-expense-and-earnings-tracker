import React, { useMemo, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from "expo-router";
import { Plus, TrendingUp, TrendingDown, Truck, MapPin } from "lucide-react-native";
import { useBusiness } from "@/hooks/business-store";
import { useTheme } from "@/hooks/theme-store";
import FloatingActionButton from "@/components/FloatingActionButton";

const DashboardScreen = React.memo(function DashboardScreen() {
  const { totals, trips, expenses, isLoading } = useBusiness();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const formatCurrency = useCallback((amount: number) => {
    return `${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }, []);

  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTrips = trips.filter(trip => trip.date === today);
    const todayExpenses = expenses.filter(expense => expense.date === today);
    const todayEarnings = todayTrips.reduce((sum, trip) => sum + trip.earnings, 0);
    const todayExpensesTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0) +
      todayTrips.reduce((sum, trip) => sum + (trip.fuelCost || 0) + (trip.otherExpenses || 0), 0);
    
    return { todayTrips, todayExpenses, todayEarnings, todayExpensesTotal };
  }, [trips, expenses]);

  const handleAddTrip = useCallback(() => {
    router.push('/add-trip');
  }, []);

  const handleAddExpense = useCallback(() => {
    router.push('/add-expense');
  }, []);

  const handleTripPress = useCallback((tripId: string) => {
    router.push(`/trip-details?id=${tripId}`);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.primary }]}>
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.primary }]}>
      <ScrollView style={[styles.scrollView, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.greeting, { color: '#fff' }]}>Welcome back, Driver!</Text>
        <Text style={[styles.date, { color: '#dbeafe' }]}>{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.tripButton]}
          onPress={handleAddTrip}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Add Trip</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.expenseButton]}
          onPress={handleAddExpense}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Summary */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Today&apos;s Summary</Text>
        <View style={styles.todayCards}>
          <View style={[styles.todayCard, { backgroundColor: theme.card }]}>
            <TrendingUp size={20} color={theme.success} />
            <Text style={[styles.todayCardLabel, { color: theme.textSecondary }]}>Earnings</Text>
            <Text style={[styles.todayCardValue, { color: theme.text }]}>{formatCurrency(todayData.todayEarnings)}</Text>
          </View>
          <View style={[styles.todayCard, { backgroundColor: theme.card }]}>
            <TrendingDown size={20} color={theme.danger} />
            <Text style={[styles.todayCardLabel, { color: theme.textSecondary }]}>Expenses</Text>
            <Text style={[styles.todayCardValue, { color: theme.text }]}>{formatCurrency(todayData.todayExpensesTotal)}</Text>
          </View>
        </View>
      </View>

      {/* Overall Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Overall Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.earningsCard, { backgroundColor: theme.card, borderLeftColor: theme.success }]}>
            <View style={styles.statHeader}>
              <TrendingUp size={24} color={theme.success} />
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Earnings</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(totals.earnings)}</Text>
          </View>

          <View style={[styles.statCard, styles.expensesCard, { backgroundColor: theme.card, borderLeftColor: theme.danger }]}>
            <View style={styles.statHeader}>
              <TrendingDown size={24} color={theme.danger} />
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Expenses</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(totals.expenses)}</Text>
          </View>

          <View style={[styles.statCard, styles.profitCard, { backgroundColor: theme.card, borderLeftColor: theme.primary }]}>
            <View style={styles.statHeader}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Net Profit</Text>
            </View>
            <Text style={[
              styles.statValue, 
              { color: totals.netProfit < 0 ? theme.danger : theme.success }
            ]}>
              {formatCurrency(totals.netProfit)}
            </Text>
          </View>

          <View style={styles.miniStats}>
            <View style={[styles.miniStat, { backgroundColor: theme.card }]}>
              <Truck size={20} color={theme.textSecondary} />
              <Text style={[styles.miniStatValue, { color: theme.text }]}>{totals.tripCount}</Text>
              <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Total Trips</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: theme.card }]}>
              <MapPin size={20} color={theme.textSecondary} />
              <Text style={[styles.miniStatValue, { color: theme.text }]}>{totals.routeCount}</Text>
              <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Saved Routes</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Trips</Text>
        {trips.slice(0, 3).map(trip => (
          <TouchableOpacity 
            key={trip.id} 
            style={[styles.activityItem, { backgroundColor: theme.card }]}
            onPress={() => handleTripPress(trip.id)}
          >
            <View style={styles.activityLeft}>
              <Text style={[styles.activityRoute, { color: theme.text }]}>{trip.routeName}</Text>
              <Text style={[styles.activityDate, { color: theme.textSecondary }]}>{new Date(trip.date).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.activityAmount, { color: theme.success }]}>+{formatCurrency(trip.earnings)}</Text>
          </TouchableOpacity>
        ))}
        {trips.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No trips recorded yet</Text>
        )}
      </View>

      <View style={styles.bottomPadding} />
      </ScrollView>
      
      <FloatingActionButton />
    </View>
  );
});

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e40af',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1e40af',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#dbeafe',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  tripButton: {
    backgroundColor: '#10b981',
  },
  expenseButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  todayCards: {
    flexDirection: 'row',
    gap: 12,
  },
  todayCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  todayCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  todayCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
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
  profitValue: {
    color: '#10b981',
  },
  negativeProfit: {
    color: '#ef4444',
  },
  miniStats: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStat: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  miniStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  activityItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityLeft: {
    flex: 1,
  },
  activityRoute: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  activityDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    padding: 20,
  },
  bottomPadding: {
    height: 20,
  },
});