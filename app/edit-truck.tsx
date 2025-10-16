import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { useTheme } from '@/hooks/theme-store';
import { Truck, Save, X } from 'lucide-react-native';

export default function EditTruckScreen() {
  const { user, updateProfile } = useAuth();
  const { theme } = useTheme();
  
  const [formData, setFormData] = useState({
    make: user?.truckInfo?.make || '',
    model: user?.truckInfo?.model || '',
    year: user?.truckInfo?.year?.toString() || '',
    plateNumber: user?.truckInfo?.plateNumber || '',
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.make || !formData.model || !formData.year || !formData.plateNumber) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    const year = parseInt(formData.year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      Alert.alert('Invalid Year', 'Please enter a valid year');
      return;
    }

    setIsSaving(true);
    const result = await updateProfile({
      truckInfo: {
        make: formData.make,
        model: formData.model,
        year: year,
        plateNumber: formData.plateNumber,
      },
    });
    setIsSaving(false);

    if (result.success) {
      Alert.alert('Success', 'Truck information updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to update truck information');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Edit Truck Information',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
          <Truck size={48} color={theme.primary} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Make</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={formData.make}
              onChangeText={(text) => setFormData({ ...formData, make: text })}
              placeholder="e.g., Freightliner, Peterbilt, Kenworth"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Model</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={formData.model}
              onChangeText={(text) => setFormData({ ...formData, model: text })}
              placeholder="e.g., Cascadia, 579, T680"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Year</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={formData.year}
              onChangeText={(text) => setFormData({ ...formData, year: text })}
              placeholder="e.g., 2020"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Plate Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={formData.plateNumber}
              onChangeText={(text) => setFormData({ ...formData, plateNumber: text })}
              placeholder="e.g., TRK-123"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: theme.background, borderColor: theme.border }]}
          onPress={() => router.back()}
          disabled={isSaving}
        >
          <X size={20} color={theme.textSecondary} />
          <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Save size={20} color="#ffffff" />
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
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
  iconContainer: {
    margin: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
