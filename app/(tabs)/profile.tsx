import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/auth-store';
import { useTheme } from '@/hooks/theme-store';
import { User, LogIn, Moon, Sun, Mail, Truck, Database, LogOut, ChevronRight, Edit, Bell, Shield, HelpCircle, FileText, Info, Fuel } from 'lucide-react-native';

export default function ProfileTab() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isAuthenticated && user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
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
              testID="tab-theme-toggle-row"
            >
              <View style={styles.themeToggleContent}>
                {isDark ? <Moon size={20} color={theme.text} /> : <Sun size={20} color={theme.text} />}
                <Text style={[styles.themeToggleText, { color: theme.text }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
              <Switch
                testID="tab-theme-switch"
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={isDark ? '#ffffff' : '#ffffff'}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <User size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Information</Text>
            </View>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => router.push('/edit-profile')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: theme.background }]}>
                  <Edit size={20} color={theme.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: theme.text }]}>Edit Profile</Text>
                  <Text style={[styles.menuItemSubtitle, { color: theme.textSecondary }]}>{user.name}</Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingVertical: 16 }]}>
              <Mail size={16} color={theme.textSecondary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{user.email}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Truck size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Truck Information</Text>
            </View>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => router.push('/edit-truck')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: theme.background }]}>
                  <Truck size={20} color={theme.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: theme.text }]}>Edit Truck</Text>
                  {user.truckInfo?.make && user.truckInfo?.model ? (
                    <Text style={[styles.menuItemSubtitle, { color: theme.textSecondary }]}>
                      {user.truckInfo.make} {user.truckInfo.model} ({user.truckInfo.year})
                    </Text>
                  ) : (
                    <Text style={[styles.menuItemSubtitle, { color: theme.textSecondary }]}>Add your truck details</Text>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Fuel size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Features</Text>
            </View>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => router.push('/fuel-tracker')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: theme.background }]}>
                  <Fuel size={20} color={theme.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: theme.text }]}>Fuel Tracker</Text>
                  <Text style={[styles.menuItemSubtitle, { color: theme.textSecondary }]}>Track MPG & fuel costs</Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => router.push('/tax-estimator')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: theme.background }]}>
                  <FileText size={20} color={theme.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: theme.text }]}>Tax Estimator</Text>
                  <Text style={[styles.menuItemSubtitle, { color: theme.textSecondary }]}>Estimate your tax deductions</Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
            </View>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                Alert.alert('Notifications', 'Notification settings will be available in a future update');
              }}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: theme.background }]}>
                  <Bell size={20} color={theme.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: theme.text }]}>Notifications</Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => router.push('/data-backup')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: theme.background }]}>
                  <Database size={20} color={theme.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: theme.text }]}>Backup & Export</Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <Info size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Support</Text>
            </View>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                Alert.alert('Help Center', 'Help and support resources will be available in a future update');
              }}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: theme.background }]}>
                  <HelpCircle size={20} color={theme.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: theme.text }]}>Help Center</Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                Alert.alert('Privacy Policy', 'Your privacy is important to us. Privacy policy details will be available in a future update.');
              }}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: theme.background }]}>
                  <Shield size={20} color={theme.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: theme.text }]}>Privacy Policy</Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                Alert.alert('Terms of Service', 'Terms and conditions will be available in a future update.');
              }}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuItemIcon, { backgroundColor: theme.background }]}>
                  <FileText size={20} color={theme.primary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: theme.text }]}>Terms of Service</Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: theme.danger }]}
              onPress={async () => {
                await logout();
                router.replace('/login');
              }}
            >
              <LogOut size={20} color="#ffffff" style={styles.logoutIcon} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? theme.card : '#eff6ff' }]}>
          <User size={64} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Profile Not Available</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          You need to be logged in to view your profile
        </Text>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/login')}
        >
          <LogIn size={20} color="#ffffff" style={styles.buttonIcon} />
          <Text style={styles.loginButtonText}>Login to Continue</Text>
        </TouchableOpacity>
        
        <View style={[styles.themeSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
          >
            <View style={styles.themeToggleContent}>
              {isDark ? <Moon size={20} color={theme.text} /> : <Sun size={20} color={theme.text} />}
              <Text style={[styles.themeToggleText, { color: theme.text }]}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              testID="tab-theme-switch"
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={isDark ? '#ffffff' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  themeSection: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500' as const,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  menuItemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  buttonContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});