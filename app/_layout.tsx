import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BusinessProvider } from "@/hooks/business-store";
import { AuthProvider } from "@/hooks/auth-store";
import { ThemeProvider, useTheme } from "@/hooks/theme-store";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { theme } = useTheme();
  
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
          <AuthProvider>
            <BusinessProvider>
              <GestureHandlerRootView style={styles.gestureHandler}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </BusinessProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  gestureHandler: {
    flex: 1,
  },
});