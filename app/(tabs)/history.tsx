import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo } from "react";
import { router } from "expo-router";
import { Calendar, Search, TrendingUp, TrendingDown } from "lucide-react-native";
import { useBusiness } from "@/hooks/business-store";
import { useTheme } from "@/hooks/theme-store";

export default function HistoryScreen() {
  const { trips, expenses, getDailySummary } = useBusiness();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Get all unique dates with activity
  const datesWithActivity = useMemo(() => {
    const dates = new Set<string>();
    trips.forEach(trip => dates.add(trip.date));
    expenses.forEach(expense => dates.add(expense.date));
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [trips, expenses]);

  // Filter dates by selected month and search term
  const filteredDates = useMemo(() => {
    return datesWithActivity.filter(date => {
      if (!date.startsWith(selectedMonth)) return false;
      if (!searchTerm) return true;
      
      const summary = getDailySummary(date);
      const searchLower = searchTerm.toLowerCase();
      
      return summary.trips.some(trip => 
        trip.routeName.toLowerCase().includes(searchLower)
      ) || summary.expenses.some(expense => 
        expense.description.toLowerCase().includes(searchLower)
      );
    });
  }, [datesWithActivity, selectedMonth, searchTerm, getDailySummary]);

  // Generate month options for the last 12 months
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      {/* Search and Filter */}
      <View style={[styles.filterSection, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
          <Search size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search trips or expenses..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={theme.textSecondary}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.monthFilter}
        >
          {monthOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.monthChip,
                { backgroundColor: selectedMonth === option.value ? theme.primary : theme.background },
                selectedMonth === option.value && styles.monthChipActive
              ]}
              onPress={() => setSelectedMonth(option.value)}
            >
              <Text style={[
                styles.monthChipText,
                { color: selectedMonth === option.value ? '#fff' : theme.textSecondary },
                selectedMonth === option.value && styles.monthChipTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Daily Summaries */}
      <ScrollView style={styles.list}>
        {filteredDates.map(date => {
          const summary = getDailySummary(date);
          const dateObj = new Date(date + 'T00:00:00');
          
          return (
            <TouchableOpacity
              key={date}
              style={[styles.dayCard, { backgroundColor: theme.card }]}
              onPress={() => router.push(`/day-details?date=${date}`)}
            >
              <View style={styles.dayHeader}>
                <View style={styles.dayDate}>
                  <Calendar size={16} color={theme.textSecondary} />
                  <Text style={[styles.dayDateText, { color: theme.text }]}>
                    {dateObj.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <Text style={[
                  styles.dayProfit,
                  summary.netProfit < 0 && styles.negativeProfitText
                ]}>
                  {summary.netProfit >= 0 ? '+' : ''}{formatCurrency(summary.netProfit)}
                </Text>
              </View>

              <View style={[styles.daySummary, { backgroundColor: theme.background }]}>
                <View style={styles.summaryItem}>
                  <TrendingUp size={16} color="#10b981" />
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Earnings</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(summary.totalEarnings)}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                <View style={styles.summaryItem}>
                  <TrendingDown size={16} color="#ef4444" />
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Expenses</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(summary.totalExpenses)}</Text>
                </View>
              </View>

              {summary.trips.length > 0 && (
                <View style={[styles.dayDetails, { borderTopColor: theme.background }]}>
                  <Text style={[styles.detailsLabel, { color: theme.textSecondary }]}>
                    {summary.trips.length} trip{summary.trips.length !== 1 ? 's' : ''}: {summary.trips.map(t => t.routeName).join(', ')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filteredDates.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No activity found</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              {searchTerm ? 'Try adjusting your search' : 'Start by adding a trip or expense'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 8,
    fontSize: 16,
  },
  monthFilter: {
    marginBottom: 8,
  },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  monthChipActive: {},
  monthChipText: {
    fontSize: 14,
  },
  monthChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  dayCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayDateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayProfit: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  negativeProfitText: {
    color: '#ef4444',
  },
  daySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  dayDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  detailsLabel: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
});