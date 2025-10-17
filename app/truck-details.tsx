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
import { useTrucks } from '@/hooks/truck-store';
import { 
  Truck, 
  Calendar, 
  Hash,
  Edit,
  Trash2,
  MapPin,
  FileText,
} from 'lucide-react-native';

export default function TruckDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { trucks, deleteTruck, selectTruck, selectedTruckId } = useTrucks();

  const truck = trucks.find(t => t.id === id);

  if (!truck) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Truck Details',
            headerStyle: { backgroundColor: theme.primary },
            headerTintColor: '#fff',
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            Truck not found
          </Text>
        </View>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Truck',
      `Are you sure you want to delete ${truck.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTruck(id);
              router.back();
            } catch (error) {
              console.error('Error deleting truck:', error);
              Alert.alert('Error', 'Failed to delete truck');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/edit-truck?id=${id}`);
  };

  const handleSelectTruck = () => {
    selectTruck(id);
    Alert.alert('Success', `${truck.name} is now your active truck`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: truck.name,
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
            <View style={[styles.truckIcon, { backgroundColor: `${theme.primary}20` }]}>
              <Truck size={48} color={theme.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>{truck.name}</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              {truck.year} {truck.make} {truck.model}
            </Text>
            {truck.color && (
              <Text style={[styles.heroDetail, { color: theme.textSecondary }]}>
                {truck.color}
              </Text>
            )}
            <View style={[styles.statusBadge, { backgroundColor: truck.isActive ? theme.success : theme.textSecondary }]}>
              <Text style={styles.statusText}>
                {truck.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {selectedTruckId === id && (
            <View style={[styles.selectedCard, { backgroundColor: theme.success }]}>
              <Text style={styles.selectedText}>Currently Selected Truck</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Details</Text>
            
            <View style={[styles.detailCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Hash size={20} color={theme.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Plate Number</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {truck.plateNumber}
                  </Text>
                </View>
              </View>

              {truck.vin && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <FileText size={20} color={theme.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>VIN</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{truck.vin}</Text>
                  </View>
                </View>
              )}

              {truck.mileage && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <MapPin size={20} color={theme.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Current Mileage</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {truck.mileage.toLocaleString()} miles
                    </Text>
                  </View>
                </View>
              )}

              {truck.purchaseDate && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Calendar size={20} color={theme.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Purchase Date</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {formatDate(truck.purchaseDate)}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Calendar size={20} color={theme.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Added</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {formatDate(truck.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {truck.notes && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes</Text>
              <View style={[styles.notesCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.notesText, { color: theme.text }]}>{truck.notes}</Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Actions</Text>
            
            {selectedTruckId !== id && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                onPress={handleSelectTruck}
              >
                <Truck size={20} color="#fff" />
                <Text style={styles.actionButtonTextWhite}>Set as Active Truck</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
              onPress={handleEdit}
            >
              <Edit size={20} color={theme.primary} />
              <Text style={[styles.actionButtonText, { color: theme.text }]}>Edit Truck</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton, { backgroundColor: theme.card, borderColor: theme.danger, borderWidth: 1 }]}
              onPress={handleDelete}
            >
              <Trash2 size={20} color={theme.danger} />
              <Text style={[styles.actionButtonText, { color: theme.danger }]}>Delete Truck</Text>
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
    alignItems: 'center' as const,
    gap: 8,
  },
  truckIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  heroSubtitle: {
    fontSize: 16,
  },
  heroDetail: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  selectedCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  selectedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
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
    justifyContent: 'center' as const,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  dangerButton: {
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  actionButtonTextWhite: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
