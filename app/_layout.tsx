import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BusinessProvider } from "@/hooks/business-store";
import { AuthProvider } from "@/hooks/auth-store";
import { ThemeProvider, useTheme } from "@/hooks/theme-store";
import { SubscriptionProvider } from "@/hooks/subscription-store";
import { TruckProvider } from "@/hooks/truck-store";
import { FuelProvider } from "@/hooks/fuel-store";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { theme, isLoading } = useTheme();
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }
  
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      headerStyle: { backgroundColor: theme.primary },
      headerTintColor: '#fff',
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-trip" 
        options={{ 
          title: "Add Trip",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="add-expense" 
        options={{ 
          title: "Add Expense",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="route-details" 
        options={{ 
          title: "Route Details",
        }} 
      />
      <Stack.Screen 
        name="day-details" 
        options={{ 
          title: "Day Details",
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: "Profile",
        }} 
      />
      <Stack.Screen 
        name="data-backup" 
        options={{ 
          title: "Data Backup",
        }} 
      />
      <Stack.Screen 
        name="expense-details" 
        options={{ 
          title: "Expense Details",
        }} 
      />
      <Stack.Screen 
        name="trip-details" 
        options={{ 
          title: "Trip Details",
        }} 
      />
      <Stack.Screen 
        name="edit-truck" 
        options={{ 
          title: "Edit Truck",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="edit-profile" 
        options={{ 
          title: "Edit Profile",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="edit-trip" 
        options={{ 
          title: "Edit Trip",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="edit-expense" 
        options={{ 
          title: "Edit Expense",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="edit-route" 
        options={{ 
          title: "Edit Route",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="upgrade" 
        options={{ 
          title: "Upgrade to Pro",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="tax-estimator" 
        options={{ 
          title: "Tax Estimator",
        }} 
      />
      <Stack.Screen 
        name="fuel-tracker" 
        options={{ 
          title: "Fuel Tracker",
        }} 
      />
      <Stack.Screen 
        name="add-fuel" 
        options={{ 
          title: "Add Fuel Entry",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="trucks" 
        options={{ 
          title: "My Trucks",
        }} 
      />
      <Stack.Screen 
        name="add-truck" 
        options={{ 
          title: "Add Truck",
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="onboarding" 
        options={{ 
          headerShown: false,
          presentation: "fullScreenModal",
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SubscriptionProvider>
            <AuthProvider>
              <TruckProvider>
                <FuelProvider>
                  <BusinessProvider>
                    <GestureHandlerRootView style={styles.gestureHandler}>
                      <RootLayoutNav />
                    </GestureHandlerRootView>
                  </BusinessProvider>
                </FuelProvider>
              </TruckProvider>
            </AuthProvider>
          </SubscriptionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  gestureHandler: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});