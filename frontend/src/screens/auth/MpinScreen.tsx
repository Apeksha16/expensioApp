import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { api } from '../../services/api';
import { haptics } from '../../services/haptics';
import { Toast, type ToastConfig } from '../../components/common/Toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MpinScreenProps {
  user: any;
  onLoginSuccess: (user: any) => void;
  onForgotMpin: () => void;
  onBackToSignIn: () => void;
}

export function MpinScreen({
  user,
  onLoginSuccess,
  onForgotMpin,
  onBackToSignIn,
}: MpinScreenProps) {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotScale1 = useRef(new Animated.Value(1)).current;
  const dotScale2 = useRef(new Animated.Value(1)).current;
  const dotScale3 = useRef(new Animated.Value(1)).current;
  const dotScale4 = useRef(new Animated.Value(1)).current;
  const dotScales = [dotScale1, dotScale2, dotScale3, dotScale4];

  const handleKeyPress = (num: string) => {
    if (lockoutRemaining) {
      setToast({
        type: 'error',
        message: `Account temporarily locked. Please retry in ${lockoutRemaining} minute(s) or tap Forgot MPIN to reset.`,
      });
      return;
    }

    if (pin.length < 4) {
      try { haptics.selection(); } catch {}
      const nextPin = pin + num;
      setPin(nextPin);

      // Animate corresponding dot
      const index = nextPin.length - 1;
      if (dotScales[index]) {
        Animated.sequence([
          Animated.timing(dotScales[index], {
            toValue: 1.35,
            duration: 100,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(dotScales[index], {
            toValue: 1,
            duration: 100,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();
      }

      if (nextPin.length === 4) {
        submitMpin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      try { haptics.selection(); } catch {}
      setPin(pin.slice(0, -1));
    }
  };

  const triggerShake = () => {
    try { haptics.error(); } catch {}
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };

  const submitMpin = async (codeToVerify: string) => {
    setIsVerifying(true);
    try {
      const response = await api.verifyMpin(user?.id || 'usr_001', codeToVerify);
      setIsVerifying(false);

      if (response.success && response.token) {
        try { haptics.success(); } catch {}
        onLoginSuccess(response.user || user);
      } else {
        triggerShake();
        setPin('');

        if (response.locked) {
          setLockoutRemaining(response.remainingMinutes || 15);
          setToast({
            type: 'error',
            message: response.error || 'Account locked for 15 minutes due to failed attempts. Tap Forgot MPIN to reset.',
          });
        } else {
          setToast({
            type: 'error',
            message: response.error || 'Incorrect 4-digit MPIN. Please try again.',
          });
        }
      }
    } catch (err: any) {
      setIsVerifying(false);
      triggerShake();
      setPin('');
      setToast({
        type: 'error',
        message: err?.message || 'Verification error. Please retry.',
      });
    }
  };

  const userName = user?.name || user?.firstName || 'Apeksha';
  const userIdentifier = user?.username
    ? user.username.startsWith('@')
      ? user.username
      : `@${user.username}`
    : user?.phone
    ? `+91 ••••• •${user.phone.slice(-4)}`
    : user?.email || '@apeksha';

  return (
    <View style={styles.container}>
      <Toast config={toast} onDismiss={() => setToast(null)} />

      {/* Atmospheric Background */}
      <LinearGradient
        colors={['#D8E8FD', '#EBF2FB', '#F1F6FB', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      {/* Header Bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToSignIn}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.brandLogoWrapper}>
          <Image
            source={require('../../../assets/expensio-logo-app.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        <View style={{ width: 36 }} />
      </SafeAreaView>

      <View style={styles.content}>
        {/* User Profile Card */}
        <View style={styles.profileBadge}>
          <View style={styles.avatarCircle}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{userName}</Text>
            <Text style={styles.identifierText}>{userIdentifier}</Text>
          </View>
        </View>

        {/* Lockout Warning Banner */}
        {lockoutRemaining && (
          <View style={styles.lockoutBanner}>
            <Feather name="alert-octagon" size={14} color="#EF4444" />
            <Text style={styles.lockoutBannerText}>
              Temporarily locked ({lockoutRemaining}m). Use Forgot MPIN below to reset immediately.
            </Text>
          </View>
        )}

        {/* Instruction */}
        <Text style={styles.instructionTitle}>Enter Your 4-Digit MPIN</Text>
        <Text style={styles.instructionSubtitle}>
          Enter your security code to unlock your private financial space
        </Text>

        {/* 4 PIN Dots */}
        <Animated.View
          style={[
            styles.dotsRow,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            const isCurrent = pin.length === index;
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dotContainer,
                  { transform: [{ scale: dotScales[index] }] },
                ]}
              >
                <View
                  style={[
                    styles.pinDot,
                    isFilled && styles.pinDotFilled,
                    isCurrent && styles.pinDotActive,
                  ]}
                >
                  {isFilled && <View style={styles.pinDotInnerGlow} />}
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Verification Loading Status */}
        <View style={styles.statusArea}>
          {isVerifying ? (
            <View style={styles.verifyingRow}>
              <ActivityIndicator size="small" color="#1864FF" />
              <Text style={styles.verifyingText}>Verifying security credentials...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.forgotMpinBtn}
              onPress={onForgotMpin}
              activeOpacity={0.7}
            >
              <Feather name="help-circle" size={13} color="#1864FF" />
              <Text style={styles.forgotMpinText}>Forgot MPIN?</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tactile Keypad */}
        <View style={styles.keypadContainer}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'delete'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((item, colIndex) => {
                if (item === '') {
                  return <View key={colIndex} style={styles.keypadPlaceholder} />;
                }
                if (item === 'delete') {
                  return (
                    <TouchableOpacity
                      key={colIndex}
                      style={styles.keypadDeleteBtn}
                      onPress={handleDelete}
                      activeOpacity={0.65}
                    >
                      <Feather name="delete" size={22} color="#0F172A" />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={colIndex}
                    style={styles.keypadNumberBtn}
                    onPress={() => handleKeyPress(item)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.keypadNumberText}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FB',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  brandLogoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1864FF',
  },
  profileMeta: {
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  nameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  identifierText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1864FF',
  },
  lockoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 8,
  },
  lockoutBannerText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginTop: 10,
    textAlign: 'center',
  },
  instructionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 280,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginVertical: 18,
  },
  dotContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDotActive: {
    borderColor: '#1864FF',
    borderWidth: 2.5,
  },
  pinDotFilled: {
    backgroundColor: '#1864FF',
    borderColor: '#1864FF',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  pinDotInnerGlow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusArea: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyingText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1864FF',
  },
  forgotMpinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  forgotMpinText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1864FF',
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  keypadNumberBtn: {
    flex: 1,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  keypadNumberText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  keypadDeleteBtn: {
    flex: 1,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  keypadPlaceholder: {
    flex: 1,
    height: 62,
  },
});
