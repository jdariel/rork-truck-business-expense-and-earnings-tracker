import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { FuelEntry, FuelStats } from '@/types/fuel';

const STORAGE_KEY = 'fuel_entries';

export const [FuelProvider, useFuel] = createContextHook(() => {
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const saveFuelEntries = useCallback(async (entries: FuelEntry[]) => {
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      }
      setFuelEntries(entries);
    } catch (error) {
      console.error('Error saving fuel entries:', error);
    }
  }, []);

  const loadFuelEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      if (Platform.OS !== 'web') {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          setFuelEntries(JSON.parse(data));
        }
      }
    } catch (error) {
      console.error('Error loading fuel entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFuelEntries();
  }, [loadFuelEntries]);

  const addFuelEntry = useCallback(async (entry: Omit<FuelEntry, 'id' | 'createdAt'>) => {
    const newEntry: FuelEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    await saveFuelEntries([...fuelEntries, newEntry]);
    return newEntry;
  }, [fuelEntries, saveFuelEntries]);

  const updateFuelEntry = useCallback(async (id: string, updates: Partial<FuelEntry>) => {
    const updated = fuelEntries.map(entry =>
      entry.id === id ? { ...entry, ...updates } : entry
    );
    await saveFuelEntries(updated);
  }, [fuelEntries, saveFuelEntries]);

  const deleteFuelEntry = useCallback(async (id: string) => {
    await saveFuelEntries(fuelEntries.filter(entry => entry.id !== id));
  }, [fuelEntries, saveFuelEntries]);

  const getFuelStats = useCallback((truckId?: string, startDate?: string, endDate?: string): FuelStats => {
    let filtered = fuelEntries;

    if (truckId) {
      filtered = filtered.filter(e => e.truckId === truckId);
    }
    if (startDate) {
      filtered = filtered.filter(e => e.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => e.date <= endDate);
    }

    filtered = filtered.sort((a, b) => a.date.localeCompare(b.date));

    const totalGallons = filtered.reduce((sum, e) => sum + e.gallons, 0);
    const totalCost = filtered.reduce((sum, e) => sum + e.totalCost, 0);
    const averagePricePerGallon = totalGallons > 0 ? totalCost / totalGallons : 0;

    let totalMilesDriven = 0;
    let averageMPG = 0;

    if (filtered.length >= 2) {
      const firstOdometer = filtered[0].odometer;
      const lastOdometer = filtered[filtered.length - 1].odometer;
      totalMilesDriven = lastOdometer - firstOdometer;
      averageMPG = totalGallons > 0 ? totalMilesDriven / totalGallons : 0;
    }

    const costPerMile = totalMilesDriven > 0 ? totalCost / totalMilesDriven : 0;

    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const monthStr = monthAgo.toISOString().split('T')[0];
    const monthlyEntries = filtered.filter(e => e.date >= monthStr);
    const monthlyAverage = monthlyEntries.length > 0
      ? monthlyEntries.reduce((sum, e) => sum + e.totalCost, 0) / monthlyEntries.length
      : 0;

    return {
      totalGallons,
      totalCost,
      averageMPG,
      averagePricePerGallon,
      totalMilesDriven,
      costPerMile,
      lastFillUp: filtered.length > 0 ? filtered[filtered.length - 1] : undefined,
      monthlyAverage,
    };
  }, [fuelEntries]);

  const getFuelEntriesByTruck = useCallback((truckId: string) => {
    return fuelEntries.filter(e => e.truckId === truckId);
  }, [fuelEntries]);

  return useMemo(() => ({
    fuelEntries,
    isLoading,
    addFuelEntry,
    updateFuelEntry,
    deleteFuelEntry,
    getFuelStats,
    getFuelEntriesByTruck,
    loadFuelEntries,
  }), [
    fuelEntries,
    isLoading,
    addFuelEntry,
    updateFuelEntry,
    deleteFuelEntry,
    getFuelStats,
    getFuelEntriesByTruck,
    loadFuelEntries,
  ]);
});
