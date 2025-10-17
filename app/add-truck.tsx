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
import { useTrucks } from '@/hooks/truck-store';
import { Truck, Calendar, FileText, Hash } from 'lucide-react-native';

export default function AddTruckScreen() {
  const { theme } = useTheme();
  const { addTruck } = useTrucks();

  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [color, setColor] = useState('');
  const [mileage, setMileage] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a truck name');
      return;
    }
    if (!make.trim()) {
      Alert.alert('Error', 'Please enter the truck make');
      return;
    }
    if (!model.trim()) {
      Alert.alert('Error', 'Please enter the truck model');
      return;
    }
    if (!year.trim() || parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear() + 1) {
      Alert.alert('Error', 'Please enter a valid year');
      return;
    }
    if (!plateNumber.trim()) {
      Alert.alert('Error', 'Please enter the plate number');
      return;
    }

    try {
      setIsSubmitting(true);
      await addTruck({
        name: name.trim(),
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        vin: vin.trim() || undefined,
        plateNumber: plateNumber.trim(),
        color: color.trim() || undefined,
        mileage: mileage ? parseInt(mileage) : undefined,
        purchaseDate: purchaseDate || undefined,
        isActive,
        notes: notes.trim() || undefined,
      });
      
      router.back();
    } catch (error) {
      console.error('Error adding truck:', error);
      Alert.alert('Error', 'Failed to add truck. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Add Truck',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              <Truck size={16} color={theme.text} /> Truck Name *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., My Freightliner, Truck #1"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Make *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={make}
                onChangeText={setMake}
                placeholder="Freightliner"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Model *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={model}
                onChangeText={setModel}
                placeholder="Cascadia"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>
                <Calendar size={16} color={theme.text} /> Year *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={year}
                onChangeText={setYear}
                placeholder="2020"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Color</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={color}
                onChangeText={setColor}
                placeholder="White"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              <Hash size={16} color={theme.text} /> Plate Number *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              value={plateNumber}
              onChangeText={setPlateNumber}
              placeholder="ABC-1234"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>VIN (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              value={vin}
              onChangeText={setVin}
              placeholder="17 digit VIN"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              maxLength={17}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Current Mileage</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={mileage}
                onChangeText={setMileage}
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Purchase Date</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                value={purchaseDate}
                onChangeText={setPurchaseDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={[styles.switchRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>Active Truck</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
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
              placeholder="Additional information about this truck..."
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
            {isSubmitting ? 'Adding...' : 'Add Truck'}
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
  row: {
    flexDirection: 'row' as const,
    gap: 12,
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
