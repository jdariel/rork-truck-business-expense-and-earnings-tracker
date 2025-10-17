import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Image } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useBusiness } from "@/hooks/business-store";
import { Calendar, TrendingUp, TrendingDown, Trash2, MapPin, Camera, Edit } from "lucide-react-native";
import { getCategoryIcon, getCategoryLabel } from "@/constants/categories";

export default function DayDetailsScreen() {
  const { date } = useLocalSearchParams();
  const { getDailySummary, deleteTrip, deleteExpense } = useBusiness();
  
  if (!date || typeof date !== 'string') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid date</Text>
      </View>
    );
  }

  const summary = getDailySummary(date);
  const dateObj = new Date(date + 'T00:00:00');

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handleDeleteTrip = (tripId: string, routeName: string) => {
    Alert.alert(
      "Delete Trip",
      `Are you sure you want to delete the trip to "${routeName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteTrip(tripId)
        }
      ]
    );
  };

  const handleDeleteExpense = (expenseId: string, description: string) => {
    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete "${description}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => deleteExpense(expenseId)
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dateHeader}>
          <Calendar size={20} color="#1e40af" />
          <Text style={styles.dateText}>
            {dateObj.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <TrendingUp size={20} color="#10b981" />
          <Text style={styles.summaryLabel}>Earnings</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalEarnings)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <TrendingDown size={20} color="#ef4444" />
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalExpenses)}</Text>
        </View>
        <View style={[
          styles.summaryCard,
          styles.profitCard,
          summary.netProfit < 0 && styles.negativeProfit
        ]}>
          <Text style={styles.summaryLabel}>Net Profit</Text>
          <Text style={[
            styles.summaryValue,
            styles.profitValue,
            summary.netProfit < 0 && styles.negativeProfitText
          ]}>
            {formatCurrency(summary.netProfit)}
          </Text>
        </View>
      </View>

      {/* Trips Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trips ({summary.trips.length})</Text>
        {summary.trips.map(trip => (
          <TouchableOpacity 
            key={trip.id} 
            style={styles.itemCard}
            onPress={() => router.push(`/trip-details?id=${trip.id}`)}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <MapPin size={16} color="#1e40af" />
                <Text style={styles.itemTitle}>{trip.routeName}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/edit-trip?id=${trip.id}`);
                  }}
                  style={styles.editButton}
                >
                  <Edit size={16} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteTrip(trip.id, trip.routeName);
                  }}
                  style={styles.deleteButton}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.itemDetails}>
              {trip.trailerNumber && (
                <Text style={styles.trailerText}>Trailer: {trip.trailerNumber}</Text>
              )}
              <Text style={styles.earningsText}>+{formatCurrency(trip.earnings)}</Text>
              {(trip.fuelCost || trip.otherExpenses) && (
                <View style={styles.tripExpenses}>
                  {trip.fuelCost && (
                    <Text style={styles.expenseText}>Fuel: -{formatCurrency(trip.fuelCost)}</Text>
                  )}
                  {trip.otherExpenses && (
                    <Text style={styles.expenseText}>Other: -{formatCurrency(trip.otherExpenses)}</Text>
                  )}
                </View>
              )}
              {trip.notes && (
                <Text style={styles.notesText}>{trip.notes}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
        {summary.trips.length === 0 && (
          <Text style={styles.emptyText}>No trips recorded</Text>
        )}
      </View>

      {/* Expenses Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expenses ({summary.expenses.length})</Text>
        {summary.expenses.map(expense => (
          <TouchableOpacity 
            key={expense.id} 
            style={styles.itemCard}
            onPress={() => router.push(`/expense-details?id=${expense.id}`)}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemInfo}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(expense.category)}</Text>
                <View style={styles.expenseInfo}>
                  <View style={styles.expenseHeaderRow}>
                    <Text style={styles.itemTitle}>{expense.description}</Text>
                    {expense.receiptImage && (
                      <Camera size={14} color="#6b7280" />
                    )}
                  </View>
                  <Text style={styles.categoryText}>{getCategoryLabel(expense.category)}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/edit-expense?id=${expense.id}`);
                  }}
                  style={styles.editButton}
                >
                  <Edit size={14} color="#3b82f6" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteExpense(expense.id, expense.description);
                  }}
                  style={styles.deleteButton}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.expenseAmount}>-{formatCurrency(expense.amount)}</Text>
              {expense.notes && (
                <Text style={styles.notesText}>{expense.notes}</Text>
              )}
              {expense.receiptImage && expense.receiptImage.trim() !== '' && (
                <View style={styles.receiptPreview}>
                  <Image 
                    source={{ uri: expense.receiptImage }} 
                    style={styles.receiptThumbnail}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
        {summary.expenses.length === 0 && (
          <Text style={styles.emptyText}>No expenses recorded</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  errorText: {
    textAlign: 'center',
    color: '#ef4444',
    fontSize: 16,
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  summarySection: {
    padding: 16,
    gap: 12,
  },
  summaryCard: {
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
  profitCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  negativeProfit: {
    borderColor: '#ef4444',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  profitValue: {
    color: '#10b981',
  },
  negativeProfitText: {
    color: '#ef4444',
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
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  itemDetails: {
    gap: 4,
  },
  earningsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  tripExpenses: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  expenseText: {
    fontSize: 14,
    color: '#ef4444',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  trailerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    padding: 20,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptPreview: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  receiptThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
});