import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
import { Plus, DollarSign, TrendingDown, Fuel } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/theme-store';

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color: string;
}

export default function FloatingActionButton() {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  const actions: ActionItem[] = [
    {
      icon: <DollarSign size={20} color="#fff" />,
      label: 'Add Trip',
      onPress: () => {
        toggleMenu();
        router.push('/add-trip');
      },
      color: '#10b981',
    },
    {
      icon: <TrendingDown size={20} color="#fff" />,
      label: 'Add Expense',
      onPress: () => {
        toggleMenu();
        router.push('/add-expense');
      },
      color: '#ef4444',
    },
    {
      icon: <Fuel size={20} color="#fff" />,
      label: 'Add Fuel',
      onPress: () => {
        toggleMenu();
        router.push('/add-fuel');
      },
      color: '#f59e0b',
    },
  ];

  const toggleMenu = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();

    setIsExpanded(!isExpanded);
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      {isExpanded && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}
      
      <View style={styles.fabContainer}>
        {actions.map((action, index) => {
          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -(70 * (actions.length - index))],
          });

          const opacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
          });

          const scale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.actionButton,
                {
                  transform: [{ translateY }, { scale }],
                  opacity,
                },
              ]}
            >
              <View style={styles.actionLabelContainer}>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </View>
              <TouchableOpacity
                style={[styles.actionCircle, { backgroundColor: action.color }]}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                {action.icon}
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: theme.primary }]}
          onPress={toggleMenu}
          activeOpacity={0.9}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Plus size={28} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'web' ? 20 : 90,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  actionButton: {
    position: 'absolute',
    right: 0,
    bottom: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionLabelContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
});
