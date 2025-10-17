export interface CloudSyncConfig {
  enabled: boolean;
  lastSyncAt?: string;
  autoSync: boolean;
  syncInterval: number;
}

export interface CloudBackup {
  id: string;
  userId: string;
  timestamp: string;
  dataVersion: string;
  trips: any[];
  expenses: any[];
  routes: any[];
  trucks: any[];
  fuelEntries: any[];
  size: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSync?: string;
  error?: string;
  pendingChanges: number;
}

export type SyncDataType = 'trips' | 'expenses' | 'routes' | 'trucks' | 'fuel' | 'settings';

export interface SyncOperation {
  id: string;
  type: SyncDataType;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  synced: boolean;
}
