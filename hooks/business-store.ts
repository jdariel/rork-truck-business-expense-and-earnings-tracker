import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useMemo } from 'react';
import { Platform } from 'react-native';
import { Route, Trip, Expense, DailySummary, MonthlySummary, ExpenseCategory } from '@/types/business';

const STORAGE_KEYS = {
  ROUTES: 'trucking_routes',
  TRIPS: 'trucking_trips',
  EXPENSES: 'trucking_expenses',
};

export const [BusinessProvider, useBusiness] = createContextHook(() => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      
      if (Platform.OS === 'web') {
        // For web, use localStorage fallback if AsyncStorage fails
        try {
          const [routesData, tripsData, expensesData] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.ROUTES),
            AsyncStorage.getItem(STORAGE_KEYS.TRIPS),
            AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
          ]);

          if (routesData) setRoutes(JSON.parse(routesData));
          if (tripsData) setTrips(JSON.parse(tripsData));
          if (expensesData) setExpenses(JSON.parse(expensesData));
        } catch {
          console.log('AsyncStorage not available on web, using empty state');
        }
      } else {
        const [routesData, tripsData, expensesData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ROUTES),
          AsyncStorage.getItem(STORAGE_KEYS.TRIPS),
          AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
        ]);

        if (routesData) setRoutes(JSON.parse(routesData));
        if (tripsData) setTrips(JSON.parse(tripsData));
        if (expensesData) setExpenses(JSON.parse(expensesData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from AsyncStorage
  useEffect(() => {
    loadData();
  }, []);

  // Save data to AsyncStorage
  const saveRoutes = async (newRoutes: Route[]) => {
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(newRoutes));
      }
      setRoutes(newRoutes);
    } catch (error) {
      console.error('Error saving routes:', error);
    }
  };

  const saveTrips = async (newTrips: Trip[]) => {
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(newTrips));
      }
      setTrips(newTrips);
    } catch (error) {
      console.error('Error saving trips:', error);
    }
  };

  const saveExpenses = async (newExpenses: Expense[]) => {
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(newExpenses));
      }
      setExpenses(newExpenses);
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  };

  // Route management
  const addRoute = async (route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRoute: Route = {
      ...route,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveRoutes([...routes, newRoute]);
    return newRoute;
  };

  const updateRoute = async (id: string, updates: Partial<Route>) => {
    const updatedRoutes = routes.map(route =>
      route.id === id
        ? { ...route, ...updates, updatedAt: new Date().toISOString() }
        : route
    );
    await saveRoutes(updatedRoutes);
  };

  const deleteRoute = async (id: string) => {
    await saveRoutes(routes.filter(route => route.id !== id));
  };

  // Trip management
  const addTrip = async (trip: Omit<Trip, 'id' | 'createdAt'>) => {
    const newTrip: Trip = {
      ...trip,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    await saveTrips([...trips, newTrip]);
    return newTrip;
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    const updatedTrips = trips.map(trip =>
      trip.id === id ? { ...trip, ...updates } : trip
    );
    await saveTrips(updatedTrips);
  };

  const deleteTrip = async (id: string) => {
    await saveTrips(trips.filter(trip => trip.id !== id));
  };

  // Expense management
  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    await saveExpenses([...expenses, newExpense]);
    return newExpense;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const updatedExpenses = expenses.map(expense =>
      expense.id === id ? { ...expense, ...updates } : expense
    );
    await saveExpenses(updatedExpenses);
  };

  const deleteExpense = async (id: string) => {
    await saveExpenses(expenses.filter(expense => expense.id !== id));
  };

  // Get route by name
  const getRouteByName = (name: string): Route | undefined => {
    return routes.find(route => 
      route.name.toLowerCase() === name.toLowerCase()
    );
  };

  // Get daily summary
  const getDailySummary = (date: string): DailySummary => {
    const dayTrips = trips.filter(trip => trip.date === date);
    const dayExpenses = expenses.filter(expense => expense.date === date);

    const totalEarnings = dayTrips.reduce((sum, trip) => sum + trip.earnings, 0);
    const totalExpenses = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0) +
      dayTrips.reduce((sum, trip) => sum + (trip.fuelCost || 0) + (trip.otherExpenses || 0), 0);

    return {
      date,
      totalEarnings,
      totalExpenses,
      netProfit: totalEarnings - totalExpenses,
      trips: dayTrips,
      expenses: dayExpenses,
    };
  };

  // Get monthly summary
  const getMonthlySummary = (year: number, month: number): MonthlySummary => {
    const monthStr = month.toString().padStart(2, '0');
    const yearMonthPrefix = `${year}-${monthStr}`;

    const monthTrips = trips.filter(trip => trip.date.startsWith(yearMonthPrefix));
    const monthExpenses = expenses.filter(expense => expense.date.startsWith(yearMonthPrefix));

    const totalEarnings = monthTrips.reduce((sum, trip) => sum + trip.earnings, 0);
    const tripExpenses = monthTrips.reduce((sum, trip) => 
      sum + (trip.fuelCost || 0) + (trip.otherExpenses || 0), 0);
    const otherExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalExpenses = tripExpenses + otherExpenses;

    const expensesByCategory: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
    monthExpenses.forEach(expense => {
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount;
    });

    // Add fuel costs from trips
    if (monthTrips.some(trip => trip.fuelCost)) {
      expensesByCategory.fuel = (expensesByCategory.fuel || 0) + 
        monthTrips.reduce((sum, trip) => sum + (trip.fuelCost || 0), 0);
    }

    const trailerNumbers = monthTrips
      .filter(trip => trip.trailerNumber)
      .map(trip => trip.trailerNumber as string);
    const uniqueTrailers = Array.from(new Set(trailerNumbers));

    return {
      month: monthStr,
      year,
      totalEarnings,
      totalExpenses,
      netProfit: totalEarnings - totalExpenses,
      tripCount: monthTrips.length,
      expensesByCategory,
      trailerNumbers: uniqueTrailers,
      monthTrips,
      monthExpenses,
    } as any;
  };

  // Calculate totals for dashboard
  const totals = useMemo(() => {
    const totalEarnings = trips.reduce((sum, trip) => sum + trip.earnings, 0);
    const tripExpenses = trips.reduce((sum, trip) => 
      sum + (trip.fuelCost || 0) + (trip.otherExpenses || 0), 0);
    const otherExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalExpenses = tripExpenses + otherExpenses;

    return {
      earnings: totalEarnings,
      expenses: totalExpenses,
      netProfit: totalEarnings - totalExpenses,
      tripCount: trips.length,
      routeCount: routes.length,
    };
  }, [trips, expenses, routes]);

  return {
    routes,
    trips,
    expenses,
    isLoading,
    addRoute,
    updateRoute,
    deleteRoute,
    addTrip,
    updateTrip,
    deleteTrip,
    addExpense,
    updateExpense,
    deleteExpense,
    getRouteByName,
    getDailySummary,
    getMonthlySummary,
    totals,
    loadData,
  };
});

// Helper hooks
export const useRouteSearch = (searchTerm: string) => {
  const { routes } = useBusiness();
  return useMemo(() => {
    if (!searchTerm) return routes;
    const term = searchTerm.toLowerCase();
    return routes.filter(route => 
      route.name.toLowerCase().includes(term)
    );
  }, [routes, searchTerm]);
};

export const useTripsByDateRange = (startDate: string, endDate: string) => {
  const { trips } = useBusiness();
  return useMemo(() => {
    return trips.filter(trip => 
      trip.date >= startDate && trip.date <= endDate
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [trips, startDate, endDate]);
};

export const useExpensesByCategory = (category?: ExpenseCategory) => {
  const { expenses } = useBusiness();
  return useMemo(() => {
    if (!category) return expenses;
    return expenses.filter(expense => expense.category === category);
  }, [expenses, category]);
};