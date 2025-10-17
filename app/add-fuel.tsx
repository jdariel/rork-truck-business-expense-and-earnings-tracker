import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/hooks/theme-store';
import { useFuel } from '@/hooks/fuel-store';
import { useTrucks } from '@/hooks/truck-store';
import { Droplet, Calendar, DollarSign, MapPin, FileText } from 'lucide-react-native';

export default function AddFuelScreen() {
  const { theme } = useTheme();
  const { addFuelEntry } = useFuel();
  const { trucks, selectedTruck } = useTrucks();

  const [truckId, setTruckId] = useState<string>(selectedTruck?.id || trucks[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [gallons, setGallons] = useState('');
  const [pricePerGallon, setPricePerGallon] = useState('');
  const [odometer, setOdometer] = useState('');
  const [location, setLocation] = useState('');
  const [isFillUp, setIsFillUp] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalCost = gallons && pricePerGallon 
    ? (parseFloat(gallons) * parseFloat(pricePerGallon)).toFixed(2)
    : '0.00';

  const handleSubmit = async () => {
    if (!truckId) {
      Alert.alert('Error', 'Please select a truck');
      return;
    }
    if (!gallons || parseFloat(gallons) <= 0) {
      Alert.alert('Error', 'Please enter valid gallons');
      return;
    }
    if (!pricePerGallon || parseFloat(pricePerGallon) <= 0) {
      Alert.alert('Error', 'Please enter valid price per gallon');
      return;
    }
    if (!odometer || parseFloat(odometer) < 0) {
      Alert.alert('Error', 'Please enter valid odometer reading');
      return;
    }

    try {
      setIsSubmitting(true);
      await addFuelEntry({
        truckId,
        date,
        gallons: parseFloat(gallons),
        pricePerGallon: parseFloat(pricePerGallon),
        totalCost: parseFloat(totalCost),
        odometer: parseFloat(odometer),
        location: location.trim() || undefined,
        isFillUp,
        notes: notes.trim() || undefined,
      });
      
      router.back();
    } catch (error) {
      console.error('Error adding fuel entry:', error);
      Alert.alert('Error', 'Failed to add fuel entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Add Fuel Entry',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Truck *</Text>
            <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {trucks.map(truck => (
                  <TouchableOpacity
                    key={truck.id}
                    style={[
                      styles.truckChip,
                      { borderColor: theme.border },
                      truckId === truck.id && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setTruckId(truck.id)}
                  >
                    <Text
                      style={[
                        styles.truckChipText,
                        { color: truckId === truck.id ? '#fff' : theme.text },
                      ]}
                    >
                      {truck.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              <Calendar size={16} color={theme.text} /> Date *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>
                <Droplet size={16} color={theme.text} /> Gallons *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={gallons}
                onChangeText={setGallons}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>
                <DollarSign size={16} color={theme.text} /> Price/Gal *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={pricePerGallon}
                onChangeText={setPricePerGallon}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={[styles.totalCard, { backgroundColor: theme.card, borderColor: theme.primary }]}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total Cost</Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>${totalCost}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Odometer Reading *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              value={odometer}
              onChangeText={setOdometer}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              <MapPin size={16} color={theme.text} /> Location
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              value={location}
              onChangeText={setLocation}
              placeholder="Station name or city"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={[styles.switchRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>Full Tank Fill-Up</Text>
            <Switch
              value={isFillUp}
              onValueChange={setIsFillUp}
              trackColor={{ false: theme.textSecondary, true: theme.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              <FileText size={16} color={theme.text} /> Notes
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: theme.border }]}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Adding...' : 'Add Entry'}
          </Text>
        </TouchableOpacity>
      </View>
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
  formContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  truckChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  truckChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  row: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  totalCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center' as const,
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  switchRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
