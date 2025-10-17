import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Truck, Plus, Edit } from 'lucide-react-native';
import { useTheme } from '@/hooks/theme-store';
import { useTrucks } from '@/hooks/truck-store';

export default function TrucksScreen() {
  const { theme } = useTheme();
  const { trucks, selectedTruckId } = useTrucks();

  const handleAddTruck = () => {
    router.push('/add-truck' as any);
  };

  const handleTruckPress = (truckId: string) => {
    router.push(`/truck-details?id=${truckId}` as any);
  };

  const handleEditTruck = (truckId: string) => {
    router.push(`/edit-truck?id=${truckId}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'My Trucks',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={handleAddTruck} style={styles.headerButton}>
              <Plus size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {trucks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Truck size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Trucks Yet</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Add your first truck to start tracking your business
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={handleAddTruck}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Add Truck</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.trucksContainer}>
            {trucks.map(truck => (
              <TouchableOpacity
                key={truck.id}
                style={[
                  styles.truckCard,
                  { 
                    backgroundColor: theme.card, 
                    borderColor: selectedTruckId === truck.id ? theme.primary : theme.border,
                    borderWidth: selectedTruckId === truck.id ? 2 : 1,
                  }
                ]}
                onPress={() => handleTruckPress(truck.id)}
              >
                <View style={styles.truckHeader}>
                  <View style={styles.truckHeaderLeft}>
                    <View style={[styles.truckIcon, { backgroundColor: `${theme.primary}20` }]}>
                      <Truck size={24} color={theme.primary} />
                    </View>
                    <View style={styles.truckInfo}>
                      <Text style={[styles.truckName, { color: theme.text }]}>{truck.name}</Text>
                      <Text style={[styles.truckDetails, { color: theme.textSecondary }]}>
                        {truck.year} {truck.make} {truck.model}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleEditTruck(truck.id)}
                    style={styles.editButton}
                  >
                    <Edit size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.truckStats, { borderTopColor: theme.border }]}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Plate</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>{truck.plateNumber}</Text>
                  </View>
                  {truck.mileage && (
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Mileage</Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>
                        {truck.mileage.toLocaleString()} mi
                      </Text>
                    </View>
                  )}
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: truck.isActive ? theme.success : theme.textSecondary }]}>
                      <Text style={styles.statusText}>
                        {truck.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedTruckId === truck.id && (
                  <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.selectedBadgeText}>Currently Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {trucks.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={handleAddTruck}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  trucksContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  truckCard: {
    borderRadius: 12,
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  truckHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  truckHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 12,
  },
  truckIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  truckInfo: {
    flex: 1,
    gap: 4,
  },
  truckName: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  truckDetails: {
    fontSize: 14,
  },
  editButton: {
    padding: 8,
  },
  truckStats: {
    flexDirection: 'row' as const,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 16,
  },
  statItem: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start' as const,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600' as const,
  },
  selectedBadge: {
    padding: 8,
    alignItems: 'center' as const,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  fab: {
    position: 'absolute' as const,
    right: 16,
    bottom: Platform.OS === 'web' ? 16 : 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
