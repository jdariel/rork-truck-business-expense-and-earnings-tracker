import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { User, Truck, Mail, Save, LogOut, Database, Moon, Sun } from 'lucide-react-native';
import { useAuth } from '@/hooks/auth-store';
import { useTheme } from '@/hooks/theme-store';

export default function ProfileScreen() {
  const { user, updateProfile, logout, isLoading } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    truckMake: user?.truckInfo?.make || '',
    truckModel: user?.truckInfo?.model || '',
    truckYear: user?.truckInfo?.year?.toString() || '',
    plateNumber: user?.truckInfo?.plateNumber || '',
  });

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const result = await updateProfile({
        name: formData.name,
        email: formData.email,
        truckInfo: {
          make: formData.truckMake,
          model: formData.truckModel,
          year: parseInt(formData.truckYear) || 0,
          plateNumber: formData.plateNumber,
        },
      });

      if (result.success) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading || !user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={20} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={[styles.avatarContainer, { backgroundColor: isDark ? theme.card : '#eff6ff' }]}>
            <User size={40} color={theme.primary} />
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            {isDark ? <Moon size={20} color={theme.primary} /> : <Sun size={20} color={theme.primary} />}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          </View>

          <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: theme.background, borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={toggleTheme}
            testID="appearance-toggle-row"
          >
            <View style={styles.themeToggleContent}>
              {isDark ? <Moon size={20} color={theme.text} /> : <Sun size={20} color={theme.text} />}
              <Text style={[styles.themeToggleText, { color: theme.text }]}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              testID="theme-switch"
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={isDark ? '#ffffff' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Information</Text>
            {!isEditing && (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={[styles.editButton, { backgroundColor: isDark ? theme.card : '#eff6ff' }]}
              >
                <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <User size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }, !isEditing && { color: theme.textSecondary }]}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                editable={isEditing}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }, !isEditing && { color: theme.textSecondary }]}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                editable={isEditing}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Truck size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Truck Information</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Make</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <TextInput
                style={[styles.input, { color: theme.text }, !isEditing && { color: theme.textSecondary }]}
                value={formData.truckMake}
                onChangeText={(value) => updateFormData('truckMake', value)}
                editable={isEditing}
                placeholder="e.g., Freightliner"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Model</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <TextInput
                style={[styles.input, { color: theme.text }, !isEditing && { color: theme.textSecondary }]}
                value={formData.truckModel}
                onChangeText={(value) => updateFormData('truckModel', value)}
                editable={isEditing}
                placeholder="e.g., Cascadia"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Year</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <TextInput
                style={[styles.input, { color: theme.text }, !isEditing && { color: theme.textSecondary }]}
                value={formData.truckYear}
                onChangeText={(value) => updateFormData('truckYear', value)}
                editable={isEditing}
                placeholder="e.g., 2020"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Plate Number</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <TextInput
                style={[styles.input, { color: theme.text }, !isEditing && { color: theme.textSecondary }]}
                value={formData.plateNumber}
                onChangeText={(value) => updateFormData('plateNumber', value)}
                editable={isEditing}
                placeholder="e.g., TRK-123"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Database size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Management</Text>
          </View>

          <TouchableOpacity
            style={[styles.dataButton, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={() => router.push('/data-backup' as any)}
          >
            <Database size={20} color={theme.primary} style={styles.dataButtonIcon} />
            <View style={styles.dataButtonContent}>
              <Text style={[styles.dataButtonTitle, { color: theme.primary }]}>Backup & Export</Text>
              <Text style={[styles.dataButtonDescription, { color: theme.textSecondary }]}>
                Export your data, create backups, and manage storage
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
              disabled={isSaving}
              onPress={() => {
                setIsEditing(false);
                setFormData({
                  name: user?.name || '',
                  email: user?.email || '',
                  truckMake: user?.truckInfo?.make || '',
                  truckModel: user?.truckInfo?.model || '',
                  truckYear: user?.truckInfo?.year?.toString() || '',
                  plateNumber: user?.truckInfo?.plateNumber || '',
                });
              }}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Save size={16} color="#ffffff" style={styles.saveIcon} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggleText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    alignItems: 'flex-end',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  toggleCircleActive: {
    transform: [{ translateX: 0 }],
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  dataButtonIcon: {
    marginRight: 12,
  },
  dataButtonContent: {
    flex: 1,
  },
  dataButtonTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  dataButtonDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
