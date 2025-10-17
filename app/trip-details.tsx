import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useBusiness } from "@/hooks/business-store";
import { Calendar, MapPin, DollarSign, Fuel, Receipt, FileText, Trash2, Edit } from "lucide-react-native";

export default function TripDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, deleteTrip } = useBusiness();
  
  const trip = trips.find(t => t.id === id);

  if (!trip) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    );
  }

  const dateObj = new Date(trip.date + 'T00:00:00');

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const totalExpenses = (trip.fuelCost || 0) + (trip.otherExpenses || 0);
  const netProfit = trip.earnings - totalExpenses;

  const handleDelete = () => {
    Alert.alert(
      "Delete Trip",
      "Are you sure you want to delete this trip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTrip(trip.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Trip Details",
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => router.push(`/edit-trip?id=${trip.id}`)}>
                <Edit size={22} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Trash2 size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsValue}>{formatCurrency(trip.earnings)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Route</Text>
            <View style={styles.routeContainer}>
              <MapPin size={24} color="#1e40af" />
              <Text style={styles.routeText}>{trip.routeName}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date</Text>
            <View style={styles.dateContainer}>
              <Calendar size={18} color="#6b7280" />
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

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Expenses Breakdown</Text>
            
            {trip.fuelCost !== undefined && trip.fuelCost > 0 && (
              <View style={styles.expenseRow}>
                <View style={styles.expenseLeft}>
                  <Fuel size={20} color="#6b7280" />
                  <Text style={styles.expenseLabel}>Fuel Cost</Text>
                </View>
                <Text style={styles.expenseValue}>{formatCurrency(trip.fuelCost)}</Text>
              </View>
            )}

            {trip.otherExpenses !== undefined && trip.otherExpenses > 0 && (
              <View style={styles.expenseRow}>
                <View style={styles.expenseLeft}>
                  <Receipt size={20} color="#6b7280" />
                  <Text style={styles.expenseLabel}>Other Expenses</Text>
                </View>
                <Text style={styles.expenseValue}>{formatCurrency(trip.otherExpenses)}</Text>
              </View>
            )}

            <View style={[styles.expenseRow, styles.totalRow]}>
              <View style={styles.expenseLeft}>
                <DollarSign size={20} color="#1f2937" />
                <Text style={styles.totalLabel}>Total Expenses</Text>
              </View>
              <Text style={styles.totalValue}>{formatCurrency(totalExpenses)}</Text>
            </View>
          </View>

          <View style={[styles.section, styles.profitSection]}>
            <Text style={styles.sectionLabel}>Net Profit</Text>
            <Text style={[
              styles.profitValue,
              netProfit < 0 && styles.negativeProfit
            ]}>
              {formatCurrency(netProfit)}
            </Text>
            <Text style={styles.profitMargin}>
              {trip.earnings > 0 
                ? `${((netProfit / trip.earnings) * 100).toFixed(1)}% margin`
                : 'No earnings'}
            </Text>
          </View>

          {trip.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Notes</Text>
              <View style={styles.notesContainer}>
                <FileText size={18} color="#6b7280" />
                <Text style={styles.notesText}>{trip.notes}</Text>
              </View>
            </View>
          )}

          <View style={styles.metaSection}>
            <Text style={styles.metaText}>
              Created: {new Date(trip.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
  earningsCard: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#d1fae5',
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#1f2937',
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expenseLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  expenseValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  profitSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profitValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  negativeProfit: {
    color: '#ef4444',
  },
  profitMargin: {
    fontSize: 14,
    color: '#6b7280',
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    flex: 1,
  },
  metaSection: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
