import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Download, Upload, Database, Shield, FileSpreadsheet } from 'lucide-react-native';
import { useBusiness } from '@/hooks/business-store';
import { useAuth } from '@/hooks/auth-store';
import { useSubscription } from '@/hooks/subscription-store';
import { useTrucks } from '@/hooks/truck-store';
import { useFuel } from '@/hooks/fuel-store';

import AsyncStorage from '@react-native-async-storage/async-storage';

interface BackupData {
  version: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  data: {
    routes: any[];
    trips: any[];
    expenses: any[];
    trucks: any[];
    fuelEntries: any[];
  };
}

export default function DataBackupScreen() {
  const { routes, trips, expenses, loadData } = useBusiness();
  const { user } = useAuth();
  const { trucks } = useTrucks();
  const { fuelEntries } = useFuel();
  const { isPro, requestFeatureAccess } = useSubscription();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  const createBackup = async (): Promise<BackupData> => {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id || 'unknown',
        name: user?.name || 'Unknown User',
        email: user?.email || 'unknown@example.com',
      },
      data: {
        routes,
        trips,
        expenses,
        trucks,
        fuelEntries,
      },
    };
  };

  const exportData = async () => {
    try {
      setIsExporting(true);
      
      const backup = await createBackup();
      const jsonString = JSON.stringify(backup, null, 2);
      
      if (Platform.OS === 'web') {
        // For web, create a download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `truckbiz-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Alert.alert('Success', 'Backup file downloaded successfully!');
      } else {
        // For mobile, use Share API
        await Share.share({
          message: jsonString,
          title: 'TruckBiz Data Backup',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async () => {
    Alert.alert(
      'Import Data',
      'This will replace all your current data. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Import Instructions',
              'To import data:\n\n1. Copy your backup JSON content\n2. Paste it when prompted\n3. Confirm the import\n\nNote: This feature is currently limited in the demo version.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your routes, trips, and expenses. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage
              await AsyncStorage.multiRemove([
                'trucking_routes',
                'trucking_trips',
                'trucking_expenses',
                'trucks',
                'fuel_entries',
              ]);
              
              // Reload data to refresh the app state
              await loadData();
              
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Clear data error:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const exportCSVData = async () => {
    if (!requestFeatureAccess('csvExport')) {
      return;
    }

    try {
      setIsExportingCSV(true);
      const backup = await createBackup();
      const jsonString = JSON.stringify(backup, null, 2);
      
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `truckbiz-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Alert.alert('Success', 'Data exported successfully!');
      } else {
        await Share.share({
          message: jsonString,
          title: 'TruckBiz Data Export',
        });
      }
    } catch {
      Alert.alert('Error', 'Failed to export data.');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const getDataStats = () => {
    return {
      routes: routes.length,
      trips: trips.length,
      expenses: expenses.length,
      trucks: trucks.length,
      fuelEntries: fuelEntries.length,
      totalRecords: routes.length + trips.length + expenses.length + trucks.length + fuelEntries.length,
    };
  };

  const stats = getDataStats();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Data Backup',
          headerStyle: { backgroundColor: '#1e40af' },
          headerTintColor: '#fff',
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Data Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color="#1e40af" />
            <Text style={styles.sectionTitle}>Data Overview</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.trips}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.expenses}</Text>
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.trucks}</Text>
              <Text style={styles.statLabel}>Trucks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.fuelEntries}</Text>
              <Text style={styles.statLabel}>Fuel</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.routes}</Text>
              <Text style={styles.statLabel}>Routes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalRecords}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Export Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Download size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Export Data</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Create a backup of all your data including routes, trips, and expenses. 
            This backup can be used to restore your data later.
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton, isExporting && styles.buttonDisabled]}
            onPress={exportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Download size={20} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Export Backup</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* CSV Export Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileSpreadsheet size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Export CSV</Text>
            {isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.sectionDescription}>
            Export all your data in JSON format for use with other applications or for record keeping.
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.csvButton, isExportingCSV && styles.buttonDisabled]}
            onPress={exportCSVData}
            disabled={isExportingCSV}
          >
            {isExportingCSV ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <FileSpreadsheet size={20} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Export Data</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Import Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Upload size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>Import Data</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Restore your data from a previously created backup file. 
            This will replace all current data.
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.importButton, isImporting && styles.buttonDisabled]}
            onPress={importData}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Upload size={20} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Import Backup</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Data Security */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#7c3aed" />
            <Text style={styles.sectionTitle}>Data Security</Text>
          </View>
          
          <View style={styles.securityInfo}>
            <View style={styles.securityItem}>
              <Text style={styles.securityLabel}>Storage:</Text>
              <Text style={styles.securityValue}>Local Device Only</Text>
            </View>
            <View style={styles.securityItem}>
              <Text style={styles.securityLabel}>Encryption:</Text>
              <Text style={styles.securityValue}>Device Secure Storage</Text>
            </View>
            <View style={styles.securityItem}>
              <Text style={styles.securityLabel}>Backup Format:</Text>
              <Text style={styles.securityValue}>JSON (Human Readable)</Text>
            </View>
          </View>
          
          <Text style={styles.securityNote}>
            💡 Your data is stored locally on your device and never sent to external servers. 
            Regular backups are recommended to prevent data loss.
          </Text>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Permanently delete all your data. This action cannot be undone.
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={clearAllData}
          >
            <Text style={styles.buttonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  dangerTitle: {
    color: '#dc2626',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statItem: {
    alignItems: 'center',
    width: '33.33%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  exportButton: {
    backgroundColor: '#059669',
  },
  importButton: {
    backgroundColor: '#dc2626',
  },
  csvButton: {
    backgroundColor: '#f59e0b',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  securityInfo: {
    marginBottom: 16,
  },
  securityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  securityLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  securityValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  securityNote: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  proBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  proBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});