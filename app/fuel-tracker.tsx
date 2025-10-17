import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Fuel, Droplet, TrendingUp, DollarSign, Calendar } from 'lucide-react-native';
import { useTheme } from '@/hooks/theme-store';
import { useFuel } from '@/hooks/fuel-store';
import { useTrucks } from '@/hooks/truck-store';
import { useSubscription } from '@/hooks/subscription-store';

export default function FuelTrackerScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { fuelEntries, getFuelStats, getFuelEntriesByTruck } = useFuel();
  const { trucks, selectedTruck } = useTrucks();
  const { requestFeatureAccess } = useSubscription();
  const [selectedTruckId, setSelectedTruckId] = useState<string>(selectedTruck?.id || 'all');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

  const filteredEntries = selectedTruckId === 'all' 
    ? fuelEntries 
    : getFuelEntriesByTruck(selectedTruckId);

  const now = new Date();
  const startDate = selectedPeriod === 'week' 
    ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    : selectedPeriod === 'month'
    ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    : undefined;

  const currentStats = getFuelStats(
    selectedTruckId === 'all' ? undefined : selectedTruckId,
    startDate,
    now.toISOString()
  );

  const handleAddFuel = () => {
    if (requestFeatureAccess('fuelTracker')) {
      router.push('/add-fuel' as any);
    }
  };

  const handleEntryPress = (entryId: string) => {
    router.push(`/fuel-details?id=${entryId}` as any);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Fuel Tracker',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>Truck:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { borderColor: theme.border },
                  selectedTruckId === 'all' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setSelectedTruckId('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedTruckId === 'all' ? '#fff' : theme.text },
                  ]}
                >
                  All Trucks
                </Text>
              </TouchableOpacity>
              {trucks.map(truck => (
                <TouchableOpacity
                  key={truck.id}
                  style={[
                    styles.filterChip,
                    { borderColor: theme.border },
                    selectedTruckId === truck.id && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setSelectedTruckId(truck.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedTruckId === truck.id ? '#fff' : theme.text },
                    ]}
                  >
                    {truck.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>Period:</Text>
            <View style={styles.periodButtons}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  { borderColor: theme.border },
                  selectedPeriod === 'week' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setSelectedPeriod('week')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: selectedPeriod === 'week' ? '#fff' : theme.text },
                  ]}
                >
                  Week
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  { borderColor: theme.border },
                  selectedPeriod === 'month' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setSelectedPeriod('month')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: selectedPeriod === 'month' ? '#fff' : theme.text },
                  ]}
                >
                  Month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  { borderColor: theme.border },
                  selectedPeriod === 'all' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setSelectedPeriod('all')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    { color: selectedPeriod === 'all' ? '#fff' : theme.text },
                  ]}
                >
                  All Time
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${theme.primary}20` }]}>
              <TrendingUp size={24} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {currentStats.averageMPG.toFixed(2)} MPG
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Avg Efficiency</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${theme.warning}20` }]}>
              <DollarSign size={24} color={theme.warning} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatCurrency(currentStats.costPerMile)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Cost/Mile</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${theme.success}20` }]}>
              <Droplet size={24} color={theme.success} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {currentStats.totalGallons.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Gallons</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${theme.danger}20` }]}>
              <Fuel size={24} color={theme.danger} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatCurrency(currentStats.totalCost)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Cost</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Entries</Text>
          <TouchableOpacity onPress={handleAddFuel}>
            <Text style={[styles.addButton, { color: theme.primary }]}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {filteredEntries.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Fuel size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No fuel entries yet
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={handleAddFuel}
            >
              <Text style={styles.emptyButtonText}>Add First Entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {filteredEntries
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry: any) => {
                const truck = trucks.find(t => t.id === entry.truckId);
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={[styles.entryCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => handleEntryPress(entry.id)}
                  >
                    <View style={styles.entryHeader}>
                      <View style={styles.entryHeaderLeft}>
                        <Text style={[styles.entryTruck, { color: theme.text }]}>
                          {truck?.name || 'Unknown Truck'}
                        </Text>
                        <View style={styles.entryDateRow}>
                          <Calendar size={14} color={theme.textSecondary} />
                          <Text style={[styles.entryDate, { color: theme.textSecondary }]}>
                            {formatDate(entry.date)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.entryHeaderRight}>
                        <Text style={[styles.entryAmount, { color: theme.text }]}>
                          {formatCurrency(entry.totalCost)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.entryDetails}>
                      <View style={styles.entryDetailItem}>
                        <Droplet size={16} color={theme.textSecondary} />
                        <Text style={[styles.entryDetailText, { color: theme.textSecondary }]}>
                          {entry.gallons.toFixed(2)} gal
                        </Text>
                      </View>
                      {entry.mpg && (
                        <View style={styles.entryDetailItem}>
                          <TrendingUp size={16} color={theme.success} />
                          <Text style={[styles.entryDetailText, { color: theme.textSecondary }]}>
                            {entry.mpg.toFixed(2)} MPG
                          </Text>
                        </View>
                      )}
                      <View style={styles.entryDetailItem}>
                        <DollarSign size={16} color={theme.warning} />
                        <Text style={[styles.entryDetailText, { color: theme.textSecondary }]}>
                          ${entry.pricePerGallon.toFixed(3)}/gal
                        </Text>
                      </View>
                    </View>

                    {entry.location && (
                      <Text style={[styles.entryLocation, { color: theme.textSecondary }]}>
                        �� {entry.location}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={handleAddFuel}
      >
        <Fuel size={24} color="#fff" />
      </TouchableOpacity>
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
  filterContainer: {
    padding: 16,
    gap: 12,
  },
  filterRow: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  filterScroll: {
    flexDirection: 'row' as const,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  periodButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center' as const,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    margin: 16,
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center' as const,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center' as const,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  entriesList: {
    padding: 16,
    gap: 12,
    paddingBottom: 100,
  },
  entryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  entryHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  entryHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  entryHeaderRight: {
    alignItems: 'flex-end' as const,
  },
  entryTruck: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  entryDateRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  entryDate: {
    fontSize: 13,
  },
  entryAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  entryDetails: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  entryDetailItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  entryDetailText: {
    fontSize: 13,
  },
  entryLocation: {
    fontSize: 13,
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
