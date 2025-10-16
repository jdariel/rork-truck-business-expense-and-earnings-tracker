export interface User {
  id: string;
  email: string;
  name: string;
  truckInfo?: {
    make: string;
    model: string;
    year: number;
    plateNumber: string;
  };
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  confirmPassword: string;
}