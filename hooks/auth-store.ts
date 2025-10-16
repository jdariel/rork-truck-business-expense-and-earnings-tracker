import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { User, AuthState, LoginCredentials, RegisterData } from '@/types/auth';

const STORAGE_KEYS = {
  USER: 'trucking_user',
  AUTH_TOKEN: 'trucking_auth_token',
};

// Mock users for demo (in production, this would be handled by a backend)
const MOCK_USERS = [
  {
    id: '1',
    email: 'driver@example.com',
    password: 'password123',
    name: 'John Driver',
    truckInfo: {
      make: 'Freightliner',
      model: 'Cascadia',
      year: 2020,
      plateNumber: 'TRK-123'
    },
    createdAt: new Date().toISOString(),
  }
];

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load user from storage on app start
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      if (Platform.OS === 'web') {
        try {
          const [userData, authToken] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.USER),
            AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
          ]);

          if (userData && authToken) {
            const user = JSON.parse(userData);
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (webError) {
          console.log('AsyncStorage not available on web, using session state');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        const [userData, authToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        ]);

        if (userData && authToken) {
          const user = JSON.parse(userData);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const saveUserToStorage = async (user: User, token: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
      ]);
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const clearUserFromStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
      ]);
    } catch (error) {
      console.error('Error clearing user from storage:', error);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in mock data (in production, this would be an API call)
      const mockUser = MOCK_USERS.find(
        user => user.email === credentials.email && user.password === credentials.password
      );
      
      if (!mockUser) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Create user object without password
      const user: User = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        truckInfo: mockUser.truckInfo,
        createdAt: mockUser.createdAt,
      };
      
      // Generate mock token
      const token = `token_${Date.now()}_${Math.random()}`;
      
      // Save to storage
      await saveUserToStorage(user, token);
      
      // Update state
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'Passwords do not match' };
      }
      
      // Check if user already exists
      const existingUser = MOCK_USERS.find(user => user.email === data.email);
      if (existingUser) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: 'User with this email already exists' };
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email: data.email,
        name: data.name,
        truckInfo: {
          make: '',
          model: '',
          year: new Date().getFullYear(),
          plateNumber: ''
        },
        createdAt: new Date().toISOString(),
      };
      
      // Add to mock users (in production, this would be handled by backend)
      MOCK_USERS.push({
        id: newUser.id,
        email: newUser.email,
        password: data.password,
        name: newUser.name,
        truckInfo: {
          make: '',
          model: '',
          year: new Date().getFullYear(),
          plateNumber: ''
        },
        createdAt: newUser.createdAt,
      });
      
      // Generate mock token
      const token = `token_${Date.now()}_${Math.random()}`;
      
      // Save to storage
      await saveUserToStorage(newUser, token);
      
      // Update state
      setAuthState({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Clear storage
      await clearUserFromStorage();
      
      // Update state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!authState.user) {
        return { success: false, error: 'No user logged in' };
      }
      
      const updatedUser = { ...authState.user, ...updates };
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (token) {
        await saveUserToStorage(updatedUser, token);
        setAuthState(prev => ({ ...prev, user: updatedUser }));
        return { success: true };
      }
      
      return { success: false, error: 'Authentication token not found' };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    loadUserFromStorage,
  };
});