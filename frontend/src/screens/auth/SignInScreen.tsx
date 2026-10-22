import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { api } from '../../services/api';
import { haptics } from '../../services/haptics';
import { LottieAnimation } from '../../components/common/LottieAnimation';
import { Toast, type ToastConfig } from '../../components/common/Toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

interface SignInScreenProps {
  onExistingUserFound: (user: any) => void;
  onNewUserDiscovered: (prefill: { phone?: string; email?: string; name?: string; type: 'phone' | 'google' }) => void;
  onBackToOnboarding?: () => void;
}

export function SignInScreen({
  onExistingUserFound,
  onNewUserDiscovered,
  onBackToOnboarding,
}: SignInScreenProps) {
  // Method selection: 'mobile' | 'username' | 'google'
  const [selectedMethod, setSelectedMethod] = useState<'mobile' | 'username'>('mobile');

  // Input states
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');

  // Discovery Loading State
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [toast, setToast] = useState<ToastConfig | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const satelliteSway1 = useRef(new Animated.Value(0)).current;
  const satelliteSway2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Breathing pulse for hero emblem
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.98,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulseLoop.start();

    // Satellite drift 1
    const swayLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(satelliteSway1, {
          toValue: 6,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(satelliteSway1, {
          toValue: -6,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    swayLoop1.start();

    // Satellite drift 2
    const swayLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(satelliteSway2, {
          toValue: -6,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(satelliteSway2, {
          toValue: 6,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    swayLoop2.start();

    return () => {
      pulseLoop.stop();
      swayLoop1.stop();
      swayLoop2.stop();
    };
  }, []);

  const cleanPhone = phone.replace(/\D/g, '');
  const cleanUsername = username.trim();
  const isInputValid =
    selectedMethod === 'mobile' ? cleanPhone.length === 10 : cleanUsername.length >= 3;

  // Account Discovery Execution
  const handleDiscover = async (overrideMethod?: 'google') => {
    const method = overrideMethod || (selectedMethod === 'mobile' ? 'phone' : 'username');
    const identifier = overrideMethod
      ? 'apeksha@expensio.app'
      : selectedMethod === 'mobile'
      ? cleanPhone
      : cleanUsername;

    setIsDiscovering(true);
    try { haptics.selection(); } catch {}

    try {
      const response = await api.discoverAccount({
        identifier,
        type: method as any,
        googleData: overrideMethod
          ? {
              email: 'apeksha@expensio.app',
              name: 'Apeksha Verma',
              token: 'google-oauth-token',
            }
          : undefined,
      });

      // Small delay to ensure smooth Lottie discovery experience
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsDiscovering(false);

      if (response.exists && response.user) {
        try { haptics.success(); } catch {}
        onExistingUserFound(response.user);
      } else if (response.requiresRegistration) {
        try { haptics.selection(); } catch {}
        onNewUserDiscovered({
          phone: response.prefill?.phone || (selectedMethod === 'mobile' ? cleanPhone : undefined),
          email: response.prefill?.email || (overrideMethod ? 'apeksha@expensio.app' : undefined),
          name: response.prefill?.name || (overrideMethod ? 'Apeksha Verma' : undefined),
          type: overrideMethod ? 'google' : 'phone',
        });
      } else {
        // Unknown username or failure
        if (selectedMethod === 'username') {
          setUsername('');
          setToast({
            type: 'error',
            message: response.message || 'No Expensio account found for this username. Please check your username or continue with mobile or Google.',
          });
        } else {
          setToast({
            type: 'error',
            message: response.error || 'Account discovery failed. Please check and retry.',
          });
        }
      }
    } catch (err: any) {
      setIsDiscovering(false);
      setToast({
        type: 'error',
        message: err?.message || 'Unable to connect to Expensio servers. Please check your network.',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      <Toast config={toast} onDismiss={() => setToast(null)} />

      {/* Atmospheric Mesh Gradient */}
      <LinearGradient
        colors={['#D8E8FD', '#EBF2FB', '#F1F6FB', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      {/* Top Ambient Glow */}
      <View style={styles.topRightAura} pointerEvents="none">
        <LinearGradient
          colors={['rgba(56, 189, 248, 0.38)', 'rgba(24, 100, 255, 0.16)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      {/* Background Vectors */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <SvgGradient id="radarRingSignIn" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1864FF" stopOpacity={0.14} />
            <Stop offset="50%" stopColor="#38BDF8" stopOpacity={0.07} />
            <Stop offset="100%" stopColor="#1864FF" stopOpacity={0.02} />
          </SvgGradient>
        </Defs>

        <Circle
          cx={SCREEN_WIDTH * 0.5}
          cy={SCREEN_HEIGHT * 0.26}
          r={130}
          stroke="url(#radarRingSignIn)"
          strokeWidth={1.2}
          strokeDasharray="4, 8"
          fill="none"
        />
        <Circle
          cx={SCREEN_WIDTH * 0.5}
          cy={SCREEN_HEIGHT * 0.26}
          r={180}
          stroke="url(#radarRingSignIn)"
          strokeWidth={1}
          strokeDasharray="6, 10"
          fill="none"
        />
      </Svg>

      {/* Header Bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.headerLeft}>
          {onBackToOnboarding ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackToOnboarding}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color="#0F172A" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          <View style={styles.brandLogoWrapper}>
            <Image
              source={require('../../../assets/expensio-logo-app.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={{ width: 36 }} />
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Emblem */}
          <View style={styles.heroSection}>
            <Svg width={220} height={190} viewBox="0 0 220 190" style={styles.heroSvg}>
              <Defs>
                <SvgGradient id="signinBlobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#38BDF8" stopOpacity={1} />
                  <Stop offset="50%" stopColor="#1864FF" stopOpacity={1} />
                  <Stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.98} />
                </SvgGradient>
                <SvgGradient id="signinBlobSoft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#BAE6FD" stopOpacity={0.5} />
                  <Stop offset="100%" stopColor="#818CF8" stopOpacity={0.15} />
                </SvgGradient>
              </Defs>

              <Circle cx={110} cy={95} r={80} fill="url(#signinBlobSoft)" />
              <Circle cx={110} cy={95} r={70} fill="url(#signinBlobGrad)" />
            </Svg>

            <Animated.View
              style={[
                styles.vaultEmblem,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F0F6FF', '#E2ECFC']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.innerEmblemCircle}>
                <Feather
                  name={selectedMethod === 'mobile' ? 'smartphone' : 'at-sign'}
                  size={30}
                  color="#1864FF"
                />
              </View>
            </Animated.View>

            {/* Orbiting Satellites */}
            <Animated.View
              style={[
                styles.satelliteTag1,
                { transform: [{ translateX: satelliteSway1 }] },
              ]}
            >
              <Feather name="zap" size={11} color="#1864FF" />
              <Text style={styles.satelliteText}>Fast Sign-In</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.satelliteTag2,
                { transform: [{ translateX: satelliteSway2 }] },
              ]}
            >
              <Feather name="shield" size={11} color="#10B981" />
              <Text style={styles.satelliteText}>100% Private</Text>
            </Animated.View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign In to Expensio</Text>
            <Text style={styles.subtitle}>
              Access your personal ledger, vaults, and smart expense splits.
            </Text>

            {/* Method Switcher Tabs */}
            <View style={styles.methodTabsWrapper}>
              <TouchableOpacity
                style={[
                  styles.methodTab,
                  selectedMethod === 'mobile' && styles.methodTabActive,
                ]}
                onPress={() => {
                  setSelectedMethod('mobile');
                  try { haptics.selection(); } catch {}
                }}
                activeOpacity={0.8}
              >
                <Feather
                  name="smartphone"
                  size={14}
                  color={selectedMethod === 'mobile' ? '#1864FF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    selectedMethod === 'mobile' && styles.methodTabTextActive,
                  ]}
                >
                  Mobile Number
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodTab,
                  selectedMethod === 'username' && styles.methodTabActive,
                ]}
                onPress={() => {
                  setSelectedMethod('username');
                  try { haptics.selection(); } catch {}
                }}
                activeOpacity={0.8}
              >
                <Feather
                  name="at-sign"
                  size={14}
                  color={selectedMethod === 'username' ? '#1864FF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.methodTabText,
                    selectedMethod === 'username' && styles.methodTabTextActive,
                  ]}
                >
                  Username
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Card */}
            {selectedMethod === 'mobile' ? (
              <View style={styles.inputCard}>
                <View style={styles.countryPicker}>
                  <Text style={styles.countryFlag}>🇮🇳</Text>
                  <Text style={styles.countryCode}>+91</Text>
                  <Feather name="chevron-down" size={14} color="#64748B" />
                </View>

                <View style={styles.inputDivider} />

                <TextInput
                  style={styles.textInputField}
                  placeholder="98765 43210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />

                {phone.length > 0 && (
                  <TouchableOpacity onPress={() => setPhone('')} style={styles.clearBtn}>
                    <Feather name="x" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.inputCard}>
                <View style={styles.usernamePrefix}>
                  <Text style={styles.atSymbol}>@</Text>
                </View>

                <View style={styles.inputDivider} />

                <TextInput
                  style={styles.textInputField}
                  placeholder="your_username"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username.replace(/^@/, '')}
                  onChangeText={(val) => setUsername(`@${val.trim()}`)}
                  autoFocus
                />

                {username.length > 0 && (
                  <TouchableOpacity onPress={() => setUsername('')} style={styles.clearBtn}>
                    <Feather name="x" size={14} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.primaryButton, !isInputValid && styles.buttonDisabled]}
              onPress={() => handleDiscover()}
              disabled={!isInputValid || isDiscovering}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isInputValid ? ['#1864FF', '#0D47D9'] : ['#94A3B8', '#64748B']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google OAuth Option */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => handleDiscover('google')}
              activeOpacity={0.8}
            >
              <GoogleIcon />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Trust Indicators */}
            <View style={styles.trustFooter}>
              <View style={styles.trustItem}>
                <Feather name="shield" size={12} color="#10B981" />
                <Text style={styles.trustText}>100% Private</Text>
              </View>
              <View style={styles.trustDot} />
              <View style={styles.trustItem}>
                <Feather name="hard-drive" size={12} color="#10B981" />
                <Text style={styles.trustText}>Local Storage</Text>
              </View>
              <View style={styles.trustDot} />
              <View style={styles.trustItem}>
                <Feather name="lock" size={12} color="#10B981" />
                <Text style={styles.trustText}>End-to-End Secure</Text>
              </View>
            </View>

            {/* Social Proof Badges */}
            <View style={styles.socialProofRow}>
              <View style={styles.proofPill}>
                <Feather name="star" size={10} color="#F59E0B" />
                <Text style={styles.proofPillText}>4.9 ★ Rating</Text>
              </View>
              <View style={styles.proofPill}>
                <Feather name="lock" size={10} color="#10B981" />
                <Text style={styles.proofPillText}>100% Offline Vault</Text>
              </View>
              <View style={styles.proofPill}>
                <Text style={styles.proofPillFlag}>🇮🇳</Text>
                <Text style={styles.proofPillText}>Made by Indian</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Account Discovery Full-Screen Modal Overlay */}
      {isDiscovering && (
        <View style={styles.discoveryOverlay}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.94)', 'rgba(235, 244, 255, 0.96)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.discoveryModalContent}>
            <LottieAnimation
              source={require('../../../assets/animations/account-discovery.json')}
              type="discovery"
              size={180}
            />
            <Text style={styles.discoveryTitle}>Checking your Expensio account...</Text>
            <Text style={styles.discoverySubtitle}>
              We're securely checking the next step for your account.
            </Text>
            <ActivityIndicator size="small" color="#1864FF" style={{ marginTop: 16 }} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF2FB',
  },
  topRightAura: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 290,
    height: 290,
    borderRadius: 145,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 6,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginTop: 6,
  },
  heroSvg: {
    position: 'absolute',
  },
  vaultEmblem: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  innerEmblemCircle: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  satelliteTag1: {
    position: 'absolute',
    top: 24,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  satelliteTag2: {
    position: 'absolute',
    bottom: 22,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  satelliteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  formContainer: {
    marginTop: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  methodTabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  methodTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  methodTabTextActive: {
    fontWeight: '800',
    color: '#1864FF',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingRight: 4,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  usernamePrefix: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  atSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1864FF',
  },
  inputDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  textInputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 12,
  },
  clearBtn: {
    padding: 6,
  },
  primaryButton: {
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#1864FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.05,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  googleBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  googleBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    marginBottom: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  trustText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  proofPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  proofPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  proofPillFlag: {
    fontSize: 12,
  },
  discoveryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  discoveryModalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 320,
  },
  discoveryTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
  discoverySubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
});
