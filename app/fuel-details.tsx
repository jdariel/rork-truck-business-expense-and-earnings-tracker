import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/theme-store';
import { useFuel } from '@/hooks/fuel-store';
import { useTrucks } from '@/hooks/truck-store';
import { 
  Droplet, 
  Calendar, 
  DollarSign, 
  MapPin, 
  FileText, 
  Gauge,
  TrendingUp,
  Trash2,
  Edit
} from 'lucide-react-native';

export default function FuelDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { fuelEntries, deleteFuelEntry } = useFuel();
  const { trucks } = useTrucks();

  const entry = fuelEntries.find(e => e.id === id);
  const truck = trucks.find(t => t.id === entry?.truckId);

  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Fuel Entry',
            headerStyle: { backgroundColor: theme.primary },
            headerTintColor: '#fff',
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            Fuel entry not found
          </Text>
        </View>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Fuel Entry',
      'Are you sure you want to delete this fuel entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFuelEntry(id);
              router.back();
            } catch (error) {
              console.error('Error deleting fuel entry:', error);
              Alert.alert('Error', 'Failed to delete fuel entry');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/edit-fuel?id=${id}` as any);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const mpg = entry.mpg;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Fuel Entry Details',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: '#fff',
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                <Edit size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Trash2 size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.heroTop}>
              <Text style={[styles.heroLabel, { color: theme.textSecondary }]}>Total Cost</Text>
              <View style={[styles.fillUpBadge, { backgroundColor: entry.isFillUp ? theme.success : theme.warning }]}>
                <Text style={styles.fillUpBadgeText}>
                  {entry.isFillUp ? 'Full Tank' : 'Partial Fill'}
                </Text>
              </View>
            </View>
            <Text style={[styles.heroValue, { color: theme.text }]}>
              {formatCurrency(entry.totalCost)}
            </Text>
            <Text style={[styles.heroSubtext, { color: theme.textSecondary }]}>
              {entry.gallons.toFixed(2)} gal × {formatCurrency(entry.pricePerGallon)}/gal
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Details</Text>
            
            <View style={[styles.detailCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Calendar size={20} color={theme.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Date</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {formatDate(entry.date)}
                  </Text>
                </View>
              </View>

              {truck && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <FileText size={20} color={theme.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Truck</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{truck.name}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Gauge size={20} color={theme.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Odometer</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {entry.odometer.toLocaleString()} miles
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Droplet size={20} color={theme.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Gallons</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {entry.gallons.toFixed(2)} gal
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <DollarSign size={20} color={theme.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Price per Gallon</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {formatCurrency(entry.pricePerGallon)}
                  </Text>
                </View>
              </View>

              {mpg && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <TrendingUp size={20} color={theme.success} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Fuel Efficiency</Text>
                    <Text style={[styles.detailValue, { color: theme.success }]}>
                      {mpg.toFixed(2)} MPG
                    </Text>
                  </View>
                </View>
              )}

              {entry.location && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <MapPin size={20} color={theme.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Location</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {entry.location}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {entry.notes && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes</Text>
              <View style={[styles.notesCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.notesText, { color: theme.text }]}>{entry.notes}</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Actions</Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleEdit}
            >
              <Edit size={20} color={theme.primary} />
              <Text style={[styles.actionButtonText, { color: theme.text }]}>Edit Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton, { backgroundColor: theme.card, borderColor: theme.danger }]}
              onPress={handleDelete}
            >
              <Trash2 size={20} color={theme.danger} />
              <Text style={[styles.actionButtonText, { color: theme.danger }]}>Delete Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  content: {
    padding: 16,
    gap: 24,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  errorText: {
    fontSize: 16,
  },
  headerRight: {
    flexDirection: 'row' as const,
    gap: 16,
    marginRight: 8,
  },
  headerButton: {
    padding: 4,
  },
  heroCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  heroTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 14,
  },
  fillUpBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fillUpBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  heroValue: {
    fontSize: 42,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  heroSubtext: {
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  detailCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  detailRow: {
    flexDirection: 'row' as const,
    padding: 16,
    gap: 12,
    alignItems: 'center' as const,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  detailContent: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  notesCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  dangerButton: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
