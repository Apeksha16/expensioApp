import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { biometrics, BiometricStatus } from '../services/biometrics';
import { haptics } from '../services/haptics';
import { api } from '../services/api';
import { secureStore } from '../services/secureStore';
import { useTheme } from '../theme/ThemeContext';

interface MpinScreenProps {
  onSuccess: () => void;
  onResetAuth: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DIAL_SIZE = Math.min(Math.floor((SCREEN_WIDTH - 120) / 3), 74);

export function MpinScreen({ onSuccess, onResetAuth }: MpinScreenProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);

  const faceIdScale = useRef(new Animated.Value(1)).current;

  const checkBiometrics = useCallback(async () => {
    const status = await biometrics.checkAvailability();
    setBiometricStatus(status);
    if (status.isAvailable) {
      animateAndTriggerFaceId();
    }
  }, [onSuccess]);

  useEffect(() => {
    checkBiometrics();
  }, [checkBiometrics]);

  const animateAndTriggerFaceId = async () => {
    Animated.sequence([
      Animated.timing(faceIdScale, {
        toValue: 0.8,
        duration: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(faceIdScale, {
        toValue: 1.1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(faceIdScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      // After animation, trigger native scan
      const success = await biometrics.authenticate('Unlock Expensio');
      if (success) {
        await haptics.success();
        onSuccess();
      }
    });
  };

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= 4 || loading) return;
    await haptics.selection();
    setError('');

    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      validatePin(newPin);
    }
  };

  const handleDelete = async () => {
    if (pin.length === 0 || loading) return;
    await haptics.light();
    setPin(pin.slice(0, -1));
    setError('');
  };

  const validatePin = async (inputPin: string) => {
    setLoading(true);
    try {
      const res = await api.verifyMpin(inputPin);
      if (res.success) {
        await haptics.success();
        onSuccess();
      } else {
        await haptics.error();
        setError(res.message || 'Incorrect PIN. Default is 1234');
        setPin('');
      }
    } catch {
      // Fallback
      if (inputPin === '1234') {
        await haptics.success();
        onSuccess();
      } else {
        await haptics.error();
        setError('Incorrect PIN. (Default: 1234)');
        setPin('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricPress = async () => {
    await haptics.light();
    setError('');
    animateAndTriggerFaceId();
  };

  const handleForgotPin = async () => {
    await haptics.light();
    await secureStore.clearAllAuth();
    onResetAuth();
  };

  const bgColor = isDark ? '#090909' : '#F6F3EE';
  const cardBg = isDark ? '#121212' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#1C1C1E';
  const textSecondary = isDark ? '#A1A1AA' : '#8E8E93';
  const borderColor = isDark ? '#27272A' : '#EBE6DE';
  const accentColor = isDark ? '#C6A584' : '#332014';
  const iconBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#EBE6DE';

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: bgColor }]}>
      <View style={styles.container}>
        {/* Header Icon */}
        <View style={styles.headerIconContainer}>
          <View style={[styles.lockIconBg, { backgroundColor: iconBg, borderColor: isDark ? borderColor : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
            <Feather name="lock" size={24} color={accentColor} />
          </View>
        </View>

        <Text style={[styles.title, { color: textPrimary }]}>Secure Access</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          Enter your 4-digit PIN to unlock Expensio
        </Text>

        {/* PIN Dots (Fixed Height Container prevents UI Shifts) */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: isDark ? '#27272A' : '#EBE6DE' },
                  isFilled && { backgroundColor: accentColor },
                ]}
              />
            );
          })}
        </View>

        {/* Status Area (Fixed Height Container prevents UI Shifts) */}
        <View style={styles.statusContainer}>
          {loading ? (
            <ActivityIndicator color={accentColor} />
          ) : error ? (
            <View style={[styles.errorBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((digit) => (
                <TouchableOpacity
                  key={digit}
                  style={[styles.dialBtn, { width: DIAL_SIZE, height: DIAL_SIZE, borderRadius: DIAL_SIZE / 2, backgroundColor: cardBg, borderColor: borderColor, shadowOpacity: isDark ? 0 : 0.05 }]}
                  activeOpacity={0.6}
                  onPress={() => handleKeyPress(digit)}
                >
                  <Text style={[styles.dialText, { color: textPrimary }]}>{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Bottom Row: Biometrics, 0, Delete */}
          <View style={styles.keypadRow}>
            <View style={{ width: DIAL_SIZE, alignItems: 'center', justifyContent: 'center' }}>
              {biometricStatus?.isAvailable && (
                <TouchableOpacity 
                  onPress={handleBiometricPress}
                  activeOpacity={0.6}
                >
                  <Animated.View style={[styles.biometricBtn, { transform: [{ scale: faceIdScale }], backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(51, 32, 20, 0.05)' }]}>
                    <Ionicons
                      name={biometricStatus.biometricType === 'FaceID' ? 'scan-outline' : 'finger-print'}
                      size={28}
                      color={accentColor}
                    />
                  </Animated.View>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.dialBtn, { width: DIAL_SIZE, height: DIAL_SIZE, borderRadius: DIAL_SIZE / 2, backgroundColor: cardBg, borderColor: borderColor, shadowOpacity: isDark ? 0 : 0.05 }]}
              activeOpacity={0.6}
              onPress={() => handleKeyPress('0')}
            >
              <Text style={[styles.dialText, { color: textPrimary }]}>0</Text>
            </TouchableOpacity>

            <View style={{ width: DIAL_SIZE, alignItems: 'center', justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={handleDelete}
                activeOpacity={0.4}
                style={styles.deleteBtn}
              >
                <Feather name="delete" size={24} color={textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <TouchableOpacity style={styles.footerBtn} onPress={handleForgotPin} activeOpacity={0.6}>
          <Text style={[styles.footerBtnText, { color: textSecondary }]}>Sign in with another account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerIconContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  lockIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 24, // Fixed height prevents shifting
    marginBottom: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusContainer: {
    height: 36, // Fixed height prevents layout shift
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  keypad: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
  },
  dialText: {
    fontSize: 28,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  biometricBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtn: {
    marginTop: 40,
    padding: 10,
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
