import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { 
  Subscription, 
  SubscriptionStatus, 
  PremiumFeatureAccess, 
  FREE_FEATURES, 
  PRO_FEATURES, 
  FeatureKey 
} from '@/types/premium';

const STORAGE_KEY = 'subscription_data';

const DEFAULT_SUBSCRIPTION: Subscription = {
  tier: 'free',
  status: 'active',
  autoRenew: false,
};

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const [subscription, setSubscription] = useState<Subscription>(DEFAULT_SUBSCRIPTION);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<FeatureKey | null>(null);

  const saveSubscription = useCallback(async (data: Subscription) => {
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      setSubscription(data);
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  }, []);

  const loadSubscription = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          setSubscription(parsed);
          
          if (parsed.tier === 'pro' && parsed.status === 'trial' && parsed.trialEndsAt) {
            const trialEnd = new Date(parsed.trialEndsAt);
            if (trialEnd < new Date()) {
              const expired = { ...parsed, status: 'expired' as SubscriptionStatus };
              setSubscription(expired);
              await saveSubscription(expired);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [saveSubscription]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const startTrial = useCallback(async () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    const trialSub: Subscription = {
      tier: 'pro',
      status: 'trial',
      trialEndsAt: trialEnd.toISOString(),
      autoRenew: false,
    };

    await saveSubscription(trialSub);
  }, [saveSubscription]);

  const upgradeToPro = useCallback(async () => {
    const proSub: Subscription = {
      tier: 'pro',
      status: 'active',
      purchaseDate: new Date().toISOString(),
      autoRenew: true,
    };

    await saveSubscription(proSub);
  }, [saveSubscription]);

  const cancelSubscription = useCallback(async () => {
    const canceledSub: Subscription = {
      ...subscription,
      status: 'canceled',
      autoRenew: false,
    };

    await saveSubscription(canceledSub);
  }, [subscription, saveSubscription]);

  const restorePurchase = useCallback(async (): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return false;
  }, []);

  const isPro = useMemo(() => {
    return subscription.tier === 'pro' && 
           (subscription.status === 'active' || subscription.status === 'trial');
  }, [subscription]);

  const isTrial = useMemo(() => {
    return subscription.tier === 'pro' && subscription.status === 'trial';
  }, [subscription]);

  const daysLeftInTrial = useMemo(() => {
    if (!isTrial || !subscription.trialEndsAt) return 0;
    const end = new Date(subscription.trialEndsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [isTrial, subscription.trialEndsAt]);

  const features = useMemo<PremiumFeatureAccess>(() => {
    return isPro ? PRO_FEATURES : FREE_FEATURES;
  }, [isPro]);

  const hasFeatureAccess = useCallback((feature: FeatureKey): boolean => {
    return features[feature];
  }, [features]);

  const requestFeatureAccess = useCallback((feature: FeatureKey): boolean => {
    if (hasFeatureAccess(feature)) {
      return true;
    }
    
    setBlockedFeature(feature);
    setShowUpgradePrompt(true);
    return false;
  }, [hasFeatureAccess]);

  const closeUpgradePrompt = useCallback(() => {
    setShowUpgradePrompt(false);
    setBlockedFeature(null);
  }, []);

  return useMemo(() => ({
    subscription,
    isLoading,
    isPro,
    isTrial,
    daysLeftInTrial,
    features,
    hasFeatureAccess,
    requestFeatureAccess,
    startTrial,
    upgradeToPro,
    cancelSubscription,
    restorePurchase,
    showUpgradePrompt,
    blockedFeature,
    closeUpgradePrompt,
  }), [
    subscription,
    isLoading,
    isPro,
    isTrial,
    daysLeftInTrial,
    features,
    hasFeatureAccess,
    requestFeatureAccess,
    startTrial,
    upgradeToPro,
    cancelSubscription,
    restorePurchase,
    showUpgradePrompt,
    blockedFeature,
    closeUpgradePrompt,
  ]);
});
