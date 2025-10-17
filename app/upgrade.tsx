import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from "expo-router";
import { Crown, Check, X, Sparkles } from "lucide-react-native";
import { useSubscription } from "@/hooks/subscription-store";
import { useTheme } from "@/hooks/theme-store";

const PRO_FEATURES = [
  { icon: "🚛", title: "Unlimited Trucks", description: "Manage multiple trucks with ease" },
  { icon: "☁️", title: "Cloud Backup", description: "Auto-sync across all devices" },
  { icon: "📊", title: "Advanced Reports", description: "Detailed analytics & charts" },
  { icon: "📸", title: "Receipt Scanner", description: "OCR powered expense capture" },
  { icon: "⛽", title: "Fuel Tracker", description: "Monitor MPG & efficiency" },
  { icon: "📄", title: "PDF/CSV Export", description: "Professional reports for taxes" },
  { icon: "💰", title: "Tax Estimator", description: "Calculate deductions easily" },
  { icon: "🤖", title: "AI Categorization", description: "Smart expense tagging" },
];

const FREE_FEATURES = [
  { icon: "📝", title: "Basic Tracking", description: "Track trips & expenses" },
  { icon: "📅", title: "History", description: "View past records" },
  { icon: "📈", title: "Simple Reports", description: "Basic summaries" },
];

export default function UpgradeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { startTrial, upgradeToPro, isPro, isTrial, daysLeftInTrial } = useSubscription();

  const handleStartTrial = async () => {
    await startTrial();
    router.back();
  };

  const handleUpgrade = async () => {
    await upgradeToPro();
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <ScrollView style={styles.content}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.crownContainer}>
            <Crown size={48} color="#fbbf24" />
            <Sparkles size={24} color="#fbbf24" style={styles.sparkle1} />
            <Sparkles size={24} color="#fbbf24" style={styles.sparkle2} />
          </View>
          <Text style={styles.headerTitle}>Upgrade to Rork Pro</Text>
          <Text style={styles.headerSubtitle}>Unlock professional features for your trucking business</Text>
        </View>

        {isPro && (
          <View style={[styles.activeProBanner, { backgroundColor: theme.success }]}>
            <Check size={20} color="#fff" />
            <Text style={styles.activeProText}>
              {isTrial 
                ? `You're on Pro Trial - ${daysLeftInTrial} days left` 
                : "You're a Pro Member!"}
            </Text>
          </View>
        )}

        <View style={styles.comparisonSection}>
          <View style={[styles.comparisonColumn, { backgroundColor: theme.card }]}>
            <Text style={[styles.columnTitle, { color: theme.textSecondary }]}>Free</Text>
            <Text style={[styles.columnPrice, { color: theme.text }]}>$0</Text>
            <View style={styles.featuresList}>
              {FREE_FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Check size={16} color={theme.success} />
                  <Text style={[styles.featureIcon, styles.smallIcon]}>{feature.icon}</Text>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                </View>
              ))}
              {PRO_FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <X size={16} color={theme.textSecondary} />
                  <Text style={[styles.featureIcon, styles.smallIcon]}>{feature.icon}</Text>
                  <Text style={[styles.featureTitle, styles.disabledFeature, { color: theme.textSecondary }]}>{feature.title}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.comparisonColumn, styles.proColumn, { backgroundColor: theme.primary }]}>
            <View style={styles.proLabel}>
              <Crown size={16} color="#fbbf24" />
              <Text style={styles.proLabelText}>PRO</Text>
            </View>
            <Text style={styles.columnTitle}>Pro</Text>
            <Text style={styles.columnPrice}>$9.99<Text style={styles.priceUnit}>/mo</Text></Text>
            <View style={styles.featuresList}>
              {[...FREE_FEATURES, ...PRO_FEATURES].map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Check size={16} color="#fbbf24" />
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Text style={[styles.detailsTitle, { color: theme.text }]}>Pro Features Explained</Text>
          {PRO_FEATURES.map((feature, index) => (
            <View key={index} style={[styles.featureDetail, { backgroundColor: theme.card }]}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureDetailText}>
                <Text style={[styles.featureDetailTitle, { color: theme.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDetailDescription, { color: theme.textSecondary }]}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {!isPro && (
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.trialButton, { backgroundColor: theme.primary }]}
            onPress={handleStartTrial}
          >
            <Text style={styles.trialButtonText}>Start 7-Day Free Trial</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.upgradeButton, { backgroundColor: theme.success }]}
            onPress={handleUpgrade}
          >
            <Crown size={20} color="#fff" />
            <Text style={styles.upgradeButtonText}>Upgrade Now - $9.99/mo</Text>
          </TouchableOpacity>
          <Text style={[styles.footerNote, { color: theme.textSecondary }]}>
            Cancel anytime. No commitments.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 32,
    alignItems: 'center',
  },
  crownContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  sparkle1: {
    position: 'absolute',
    top: -8,
    right: -12,
  },
  sparkle2: {
    position: 'absolute',
    bottom: -8,
    left: -12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#dbeafe',
    textAlign: 'center',
  },
  activeProBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  activeProText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  comparisonSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  comparisonColumn: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  proColumn: {
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  proLabel: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  proLabelText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: 'bold',
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  columnPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    fontSize: 16,
  },
  smallIcon: {
    fontSize: 14,
  },
  featureTitle: {
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },
  disabledFeature: {
    opacity: 0.5,
  },
  detailsSection: {
    padding: 16,
    gap: 12,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureDetail: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
  },
  featureDetailText: {
    flex: 1,
  },
  featureDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDetailDescription: {
    fontSize: 14,
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  trialButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  trialButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  upgradeButton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
  },
});
