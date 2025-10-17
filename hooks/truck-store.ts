import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { Truck } from '@/types/truck';

const STORAGE_KEY = 'trucks_data';

export const [TruckProvider, useTrucks] = createContextHook(() => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveTrucks = useCallback(async (newTrucks: Truck[]) => {
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTrucks));
      }
      setTrucks(newTrucks);
    } catch (error) {
      console.error('Error saving trucks:', error);
    }
  }, []);

  const loadTrucks = useCallback(async () => {
    try {
      setIsLoading(true);
      if (Platform.OS !== 'web') {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          setTrucks(parsed);
          
          const activeTruck = parsed.find((t: Truck) => t.isActive);
          if (activeTruck) {
            setSelectedTruckId(activeTruck.id);
          } else if (parsed.length > 0) {
            setSelectedTruckId(parsed[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading trucks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrucks();
  }, [loadTrucks]);

  const addTruck = useCallback(async (truck: Omit<Truck, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTruck: Truck = {
      ...truck,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await saveTrucks([...trucks, newTruck]);
    
    if (trucks.length === 0) {
      setSelectedTruckId(newTruck.id);
    }
    
    return newTruck;
  }, [trucks, saveTrucks]);

  const updateTruck = useCallback(async (id: string, updates: Partial<Truck>) => {
    const updatedTrucks = trucks.map(truck =>
      truck.id === id
        ? { ...truck, ...updates, updatedAt: new Date().toISOString() }
        : truck
    );
    await saveTrucks(updatedTrucks);
  }, [trucks, saveTrucks]);

  const deleteTruck = useCallback(async (id: string) => {
    const filtered = trucks.filter(truck => truck.id !== id);
    await saveTrucks(filtered);
    
    if (selectedTruckId === id) {
      setSelectedTruckId(filtered.length > 0 ? filtered[0].id : null);
    }
  }, [trucks, selectedTruckId, saveTrucks]);

  const selectTruck = useCallback((id: string | null) => {
    setSelectedTruckId(id);
  }, []);

  const selectedTruck = useMemo(() => {
    return trucks.find(t => t.id === selectedTruckId) || null;
  }, [trucks, selectedTruckId]);

  const activeTrucks = useMemo(() => {
    return trucks.filter(t => t.isActive);
  }, [trucks]);

  return useMemo(() => ({
    trucks,
    selectedTruckId,
    selectedTruck,
    activeTrucks,
    isLoading,
    addTruck,
    updateTruck,
    deleteTruck,
    selectTruck,
    loadTrucks,
  }), [
    trucks,
    selectedTruckId,
    selectedTruck,
    activeTrucks,
    isLoading,
    addTruck,
    updateTruck,
    deleteTruck,
    selectTruck,
    loadTrucks,
  ]);
});
