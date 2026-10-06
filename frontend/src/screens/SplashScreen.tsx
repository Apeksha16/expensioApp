import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Easing,
} from 'react-native';
import { spacing } from '../theme';
import { IconWallet } from '../components/icons/Icons';
import { Feather } from '@expo/vector-icons';
import { haptics } from '../services/haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface SplashScreenProps {
  onFinish: () => void;
}

const VERBIAGES = [
  "Initializing secure vault...",
  "Syncing your accounts...",
  "Encrypting financial data...",
  "Fetching biometric details...",
];

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const isNative = Platform.OS !== 'web';
  
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const faceIdOpacity = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  
  const [verbiageIndex, setVerbiageIndex] = useState(0);

  useEffect(() => {
    // 1. Initial Logo pop-in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: isNative,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: isNative,
      })
    ]).start();

    // 2. Verbiage cycle
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < VERBIAGES.length) {
        // Fade out
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: isNative,
        }).start(() => {
          setVerbiageIndex(currentIndex);
          // Fade in
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: isNative,
          }).start();
        });
      }
    }, 800);

    // Initial fade in for first text
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 400,
      delay: 400,
      useNativeDriver: isNative,
    }).start();

    // 3. Trigger Face ID scanning animation near the end
    setTimeout(() => {
      Animated.timing(faceIdOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: isNative,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: isNative,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: isNative,
          })
        ])
      ).start();
      
      haptics.medium();
    }, 2400); // 2.4s in, show face id

    // 4. Finish
    const timer = setTimeout(() => {
      clearInterval(interval);
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: isNative,
      }).start(() => {
        haptics.success();
        onFinish();
      });
    }, 3800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 20],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#E0F2FE']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={[styles.content, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        
        {/* Core Logo */}
        <View style={styles.iconWrapper}>
          <IconWallet size={48} color="#3B82F6" />
        </View>

        <Text style={styles.brandTitle}>
          Expensio
        </Text>
        
        {/* Animated Face ID Scanner */}
        <Animated.View style={[styles.faceIdContainer, { opacity: faceIdOpacity }]}>
          <Feather name="smile" size={32} color="#3B82F6" />
          <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]} />
        </Animated.View>

        {/* Dynamic Verbiages */}
        <View style={styles.verbiageContainer}>
          <Animated.Text style={[styles.verbiageText, { opacity: textOpacity }]}>
            {VERBIAGES[verbiageIndex]}
          </Animated.Text>
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.8,
    marginBottom: 40,
  },
  faceIdContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  verbiageContainer: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verbiageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});
