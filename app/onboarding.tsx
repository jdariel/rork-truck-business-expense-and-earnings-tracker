import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  TrendingUp,
  FileText,
  Truck,
  BarChart3,
  Fuel,
  Calculator,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/theme-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const ONBOARDING_KEY = '@rork_onboarding_completed';

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const slides: OnboardingSlide[] = [
    {
      title: 'Track Your Business',
      description: 'Easily track all your trips, expenses, and earnings in one place. Keep your trucking business organized.',
      icon: <TrendingUp size={80} color="#10b981" />,
      color: '#10b981',
    },
    {
      title: 'Manage Multiple Trucks',
      description: 'Support for multiple trucks with individual tracking. Perfect for owner-operators and small fleets.',
      icon: <Truck size={80} color="#1e40af" />,
      color: '#1e40af',
    },
    {
      title: 'Fuel Efficiency',
      description: 'Monitor fuel consumption, track MPG, and optimize your fuel costs with detailed fuel tracking.',
      icon: <Fuel size={80} color="#f59e0b" />,
      color: '#f59e0b',
    },
    {
      title: 'Detailed Reports',
      description: 'Generate comprehensive reports with charts and insights. Export to CSV for accounting.',
      icon: <BarChart3 size={80} color="#8b5cf6" />,
      color: '#8b5cf6',
    },
    {
      title: 'Tax Estimator',
      description: 'Calculate quarterly tax estimates and track deductible expenses to maximize your tax savings.',
      icon: <Calculator size={80} color="#ef4444" />,
      color: '#ef4444',
    },
    {
      title: 'Export & Backup',
      description: 'Export your data to CSV/JSON and create backups. Your data is always safe and accessible.',
      icon: <FileText size={80} color="#06b6d4" />,
      color: '#06b6d4',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/');
    }
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(slideIndex);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        {currentSlide < slides.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View
            key={index}
            style={[styles.slide, { width: SCREEN_WIDTH }]}
          >
            <View style={styles.slideContent}>
              <View style={[styles.iconContainer, { backgroundColor: `${slide.color}15` }]}>
                {slide.icon}
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentSlide ? theme.primary : theme.border,
                  width: index === currentSlide ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          {currentSlide === slides.length - 1 ? (
            <Check size={20} color="#fff" style={styles.buttonIcon} />
          ) : (
            <ArrowRight size={20} color="#fff" style={styles.buttonIcon} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: 10,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'android' ? 20 : 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
