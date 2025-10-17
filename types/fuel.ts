export interface FuelEntry {
  id: string;
  truckId?: string;
  date: string;
  gallons: number;
  pricePerGallon: number;
  totalCost: number;
  odometer: number;
  location?: string;
  isFillUp: boolean;
  notes?: string;
  receiptImage?: string;
  mpg?: number;
  createdAt: string;
}

export interface FuelStats {
  totalGallons: number;
  totalCost: number;
  averageMPG: number;
  averagePricePerGallon: number;
  totalMilesDriven: number;
  costPerMile: number;
  lastFillUp?: FuelEntry;
  monthlyAverage: number;
}

export interface MPGCalculation {
  mpg: number;
  milesDriven: number;
  gallonsUsed: number;
  startOdometer: number;
  endOdometer: number;
}
