export type SubscriptionTier = 'free' | 'pro';

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'canceled';

export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiresAt?: string;
  trialEndsAt?: string;
  purchaseDate?: string;
  autoRenew: boolean;
}

export interface PremiumFeatureAccess {
  multiTruck: boolean;
  cloudBackup: boolean;
  advancedReports: boolean;
  receiptScanner: boolean;
  fuelTracker: boolean;
  pdfExport: boolean;
  csvExport: boolean;
  taxEstimator: boolean;
  aiCategorization: boolean;
}

export const FREE_FEATURES: PremiumFeatureAccess = {
  multiTruck: false,
  cloudBackup: false,
  advancedReports: false,
  receiptScanner: false,
  fuelTracker: true,
  pdfExport: false,
  csvExport: false,
  taxEstimator: true,
  aiCategorization: false,
};

export const PRO_FEATURES: PremiumFeatureAccess = {
  multiTruck: true,
  cloudBackup: true,
  advancedReports: true,
  receiptScanner: true,
  fuelTracker: true,
  pdfExport: true,
  csvExport: true,
  taxEstimator: true,
  aiCategorization: true,
};

export type FeatureKey = keyof PremiumFeatureAccess;

export interface UpgradePrompt {
  feature: FeatureKey;
  title: string;
  description: string;
  icon: string;
}
