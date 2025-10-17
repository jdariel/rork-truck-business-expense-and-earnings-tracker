export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'trip_added'
  | 'trip_edited'
  | 'trip_deleted'
  | 'expense_added'
  | 'expense_edited'
  | 'expense_deleted'
  | 'fuel_entry_added'
  | 'fuel_entry_edited'
  | 'fuel_entry_deleted'
  | 'route_added'
  | 'route_edited'
  | 'route_deleted'
  | 'truck_added'
  | 'truck_edited'
  | 'truck_deleted'
  | 'report_viewed'
  | 'report_exported'
  | 'tax_estimator_viewed'
  | 'backup_created'
  | 'backup_restored'
  | 'data_exported'
  | 'theme_toggled'
  | 'subscription_viewed'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'feature_gate_shown'
  | 'upgrade_clicked';

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

class AnalyticsService {
  private enabled = __DEV__ ? false : true;

  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    if (!this.enabled) {
      console.log(`[Analytics] ${event}`, properties);
      return;
    }

    try {
      const eventData = {
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          platform: 'mobile',
        },
      };

      console.log('[Analytics] Event tracked:', eventData);
    } catch (error) {
      console.error('[Analytics] Error tracking event:', error);
    }
  }

  screen(screenName: string, properties?: AnalyticsProperties): void {
    this.track('app_opened', {
      screen: screenName,
      ...properties,
    });
  }

  setUserId(userId: string): void {
    if (!this.enabled) {
      console.log(`[Analytics] User ID set: ${userId}`);
      return;
    }

    try {
      console.log('[Analytics] User ID set:', userId);
    } catch (error) {
      console.error('[Analytics] Error setting user ID:', error);
    }
  }

  setUserProperties(properties: AnalyticsProperties): void {
    if (!this.enabled) {
      console.log('[Analytics] User properties set:', properties);
      return;
    }

    try {
      console.log('[Analytics] User properties set:', properties);
    } catch (error) {
      console.error('[Analytics] Error setting user properties:', error);
    }
  }

  resetUser(): void {
    if (!this.enabled) {
      console.log('[Analytics] User reset');
      return;
    }

    try {
      console.log('[Analytics] User reset');
    } catch (error) {
      console.error('[Analytics] Error resetting user:', error);
    }
  }

  enable(): void {
    this.enabled = true;
    console.log('[Analytics] Analytics enabled');
  }

  disable(): void {
    this.enabled = false;
    console.log('[Analytics] Analytics disabled');
  }

  trackTripAction(action: 'added' | 'edited' | 'deleted', tripData: {
    earnings: number;
    hasFuelCost: boolean;
    hasOtherExpenses: boolean;
  }): void {
    this.track(`trip_${action}` as AnalyticsEvent, {
      earnings: tripData.earnings,
      has_fuel_cost: tripData.hasFuelCost,
      has_other_expenses: tripData.hasOtherExpenses,
    });
  }

  trackExpenseAction(action: 'added' | 'edited' | 'deleted', expenseData: {
    category: string;
    amount: number;
    hasReceipt: boolean;
  }): void {
    this.track(`expense_${action}` as AnalyticsEvent, {
      category: expenseData.category,
      amount: expenseData.amount,
      has_receipt: expenseData.hasReceipt,
    });
  }

  trackFuelAction(action: 'added' | 'edited' | 'deleted', fuelData: {
    gallons: number;
    totalCost: number;
    mpg?: number;
  }): void {
    this.track(`fuel_entry_${action}` as AnalyticsEvent, {
      gallons: fuelData.gallons,
      total_cost: fuelData.totalCost,
      mpg: fuelData.mpg,
    });
  }

  trackExportAction(exportType: 'csv' | 'json' | 'pdf', dataType: 'trips' | 'expenses' | 'fuel' | 'all'): void {
    this.track('data_exported', {
      export_type: exportType,
      data_type: dataType,
    });
  }

  trackSubscriptionEvent(event: 'viewed' | 'started' | 'cancelled', plan?: string): void {
    this.track(`subscription_${event}` as AnalyticsEvent, {
      plan,
    });
  }

  trackFeatureGate(feature: string, hasAccess: boolean): void {
    this.track('feature_gate_shown', {
      feature,
      has_access: hasAccess,
    });
  }
}

export const analytics = new AnalyticsService();

export default analytics;
