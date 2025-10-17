export interface Truck {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  plateNumber: string;
  color?: string;
  isActive: boolean;
  purchaseDate?: string;
  mileage?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TruckMaintenanceRecord {
  id: string;
  truckId: string;
  date: string;
  type: 'oil_change' | 'tire_rotation' | 'brake_service' | 'inspection' | 'repair' | 'other';
  description: string;
  cost: number;
  mileage?: number;
  nextServiceMileage?: number;
  nextServiceDate?: string;
  notes?: string;
  receiptImage?: string;
  createdAt: string;
}
