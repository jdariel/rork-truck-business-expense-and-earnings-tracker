import { StyleSheet, Text, View, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useBusiness } from "@/hooks/business-store";
import { MapPin, DollarSign, Calendar, FileText, Edit, Trash2 } from "lucide-react-native";

export default function RouteDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { routes, trips, deleteRoute } = useBusiness();
  
  const route = routes.find(r => r.id === id);
  const routeTrips = trips.filter(t => t.routeName === route?.name);

  if (!route) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Route not found</Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Route",
      `Are you sure you want to delete "${route.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteRoute(route.id);
            router.back();
          },
        },
      ]
    );
  };

  const totalEarnings = routeTrips.reduce((sum, trip) => sum + trip.earnings, 0);
  const averageEarnings = routeTrips.length > 0 ? totalEarnings / routeTrips.length : 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Route Details",
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => router.push(`/edit-route?id=${route.id}`)}>
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
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <MapPin size={24} color="#1e40af" />
          <Text style={styles.routeName}>{route.name}</Text>
        </View>
        <Text style={styles.routePayment}>{formatCurrency(route.payment)}</Text>
      </View>

      {route.distance && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>{route.distance} miles</Text>
        </View>
      )}

      {route.notes && (
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <FileText size={18} color="#6b7280" />
            <Text style={styles.notesTitle}>Notes</Text>
          </View>
          <Text style={styles.notesText}>{route.notes}</Text>
        </View>
      )}

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Route Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Trips</Text>
            <Text style={styles.statValue}>{routeTrips.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <Text style={styles.statValue}>{formatCurrency(totalEarnings)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Average Earnings</Text>
            <Text style={styles.statValue}>{formatCurrency(averageEarnings)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tripsSection}>
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        {routeTrips.slice(0, 10).map(trip => (
          <View key={trip.id} style={styles.tripCard}>
            <View style={styles.tripDate}>
              <Calendar size={16} color="#6b7280" />
              <Text style={styles.tripDateText}>
                {new Date(trip.date).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.tripEarnings}>{formatCurrency(trip.earnings)}</Text>
          </View>
        ))}
        {routeTrips.length === 0 && (
          <Text style={styles.emptyText}>No trips recorded for this route</Text>
        )}
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
  errorText: {
    textAlign: 'center',
    color: '#ef4444',
    fontSize: 16,
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  routeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  routePayment: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
  },
  detailRow: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  notesSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tripsSection: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripDateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tripEarnings: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    padding: 20,
  },
});