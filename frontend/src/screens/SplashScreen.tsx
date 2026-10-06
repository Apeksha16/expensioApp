import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { spacing } from '../theme';
import { IconWallet } from '../components/icons/Icons';
import { useTheme } from '../theme/ThemeContext';
import { haptics } from '../services/haptics';

interface SplashScreenProps {
  onFinish: () => void;
}

import { LinearGradient } from 'expo-linear-gradient';

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const { colors, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isNative = Platform.OS !== 'web';

  useEffect(() => {
    // ... animation code ...
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: isNative,
    }).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1000,
          useNativeDriver: isNative,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: isNative,
        }),
      ])
    );
    pulseLoop.start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      haptics.light();
      onFinish();
    }, 1900);

    return () => {
      pulseLoop.stop();
      clearTimeout(timer);
    };
  }, [fadeAnim, pulseAnim, progressAnim, isNative, onFinish]);

  const handleSkip = () => {
    haptics.light();
    onFinish();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: '#022C22' }]}>
      <LinearGradient
        colors={['#022C22', '#064E3B', '#0F766E']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Minimal Icon Badge */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: isDark ? 'rgba(0, 229, 168, 0.1)' : '#F0FDF9',
              borderColor: isDark ? 'rgba(0, 229, 168, 0.25)' : '#CCFBF1',
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <IconWallet size={36} color="#00E5A8" />
        </Animated.View>

        {/* Minimal Typography */}
        <Text style={[styles.brandTitle, { color: '#F8FAFC' }]}>
          expensio
        </Text>
        <Text style={[styles.brandSubtitle, { color: '#94A3B8' }]}>
          Smart wealth & shared expenses
        </Text>

        {/* Hairline Progress Indicator */}
        <View style={styles.loadingWrapper}>
          <View
            style={[
              styles.progressBarBg,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: progressWidth, backgroundColor: '#14B8A6' },
              ]}
            />
          </View>
        </View>

        {/* Skip button */}
        <TouchableOpacity
          style={styles.skipButton}
          activeOpacity={0.6}
          onPress={handleSkip}
        >
          <Text style={[styles.skipButtonText, { color: '#94A3B8' }]}>
            Continue →
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  iconWrapper: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  loadingWrapper: {
    width: 140,
    marginBottom: spacing.lg,
  },
  progressBarBg: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
