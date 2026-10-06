import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { SplashScreen } from './SplashScreen';
import { MpinScreen } from './MpinScreen';
import { OnboardingProfileScreen } from './OnboardingProfileScreen';

interface AuthScreenProps {
  onAuthenticated: (user: any, isProfileComplete?: boolean) => void;
}

const COUNTRIES = [
  { name: 'India', code: 'IN', callingCode: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', callingCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', callingCode: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: 'CA', callingCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', callingCode: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', callingCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', callingCode: '+33', flag: '🇫🇷' },
  { name: 'Japan', code: 'JP', callingCode: '+81', flag: '🇯🇵' },
  { name: 'China', code: 'CN', callingCode: '+86', flag: '🇨🇳' },
  { name: 'United Arab Emirates', code: 'AE', callingCode: '+971', flag: '🇦🇪' },
];

const FloatingCards = () => (
  <View style={styles.floatingCardsContainer}>
    {/* Background faded large card to create depth */}
    <View style={[styles.cardBase, styles.cardBg2, { transform: [{ rotate: '-14deg' }, { translateX: -15 }, { translateY: 25 }] }]} />
    <View style={[styles.cardBase, styles.cardBg1, { transform: [{ rotate: '-10deg' }, { translateX: -5 }, { translateY: 10 }] }]} />
    
    <View style={[styles.cardBase, styles.cardMain, { transform: [{ rotate: '-6deg' }] }]}>
      {/* Item 1 */}
      <View style={styles.cardItem}>
        <View style={[styles.cardIconBox, { backgroundColor: '#14B8A6' }]}>
          <Feather name="coffee" size={12} color="#FFF" />
        </View>
        <View style={styles.cardItemTexts}>
          <Text style={styles.cardItemTitle}>Coffee</Text>
          <Text style={styles.cardItemSubtitle}>₹320</Text>
        </View>
      </View>
      {/* Item 2 */}
      <View style={styles.cardItem}>
        <View style={[styles.cardIconBox, { backgroundColor: '#34D399' }]}>
          <Feather name="send" size={12} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
        </View>
        <View style={styles.cardItemTexts}>
          <Text style={styles.cardItemTitle}>Flight</Text>
          <Text style={styles.cardItemSubtitle}>₹12,450</Text>
        </View>
      </View>
      {/* Item 3 */}
      <View style={styles.cardItem}>
        <View style={[styles.cardIconBox, { backgroundColor: '#0EA5E9' }]}>
          <Feather name="home" size={12} color="#FFF" />
        </View>
        <View style={styles.cardItemTexts}>
          <Text style={styles.cardItemTitle}>Rent</Text>
          <Text style={styles.cardItemSubtitle}>₹18,000</Text>
        </View>
      </View>
    </View>
  </View>
);

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryModalVisible, setCountryModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    flowState,
    phone,
    otp,
    loading,
    error,
    currentUser,
    setPhone,
    setOtp,
    sendOtp,
    verifyOtp,
    finishSplash,
    onMpinSuccess,
    onResetAuth,
    onOnboardingCompleted,
    switchToPhoneLogin,
  } = useAuth(onAuthenticated);

  // 1. Splash Screen
  if (flowState === 'splash') {
    return <SplashScreen onFinish={finishSplash} />;
  }

  // 2. MPIN Guard
  if (flowState === 'mpin_guard') {
    return <MpinScreen onSuccess={onMpinSuccess} onResetAuth={onResetAuth} />;
  }

  // 3. Onboarding Setup
  if (flowState === 'onboarding') {
    return (
      <OnboardingProfileScreen
        initialUser={currentUser}
        onCompleted={onOnboardingCompleted}
      />
    );
  }

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.callingCode.includes(searchQuery)
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#022C22', '#064E3B', '#0F766E']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.blob1} />
        <View style={styles.blob2} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Area */}
        <View style={styles.headerArea}>
          <Text style={styles.brandTitle}>Expensio</Text>
          <Text style={styles.brandSubtitle}>
            A smarter way{'\n'}to handle money{'\n'}together.
          </Text>
        </View>

        {/* Floating Cards Graphic */}
        <FloatingCards />

        {/* Main Title Area */}
        <View style={styles.titleArea}>
          <Text style={styles.mainHeading}>
            {flowState === 'otp_verify' ? 'Verify your identity' : 'Track today\nfor a brighter\ntomorrow'}
          </Text>
          <Text style={styles.subHeading}>
            {flowState === 'otp_verify' 
              ? `Enter the 6-digit code sent to ${selectedCountry.callingCode} ${phone}`
              : 'Simple. Secure. Built for you.'}
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Form Area */}
        {flowState === 'login_screen' ? (
          <View style={styles.formContainer}>
            <View style={styles.inputPill}>
              <TouchableOpacity 
                style={styles.countryBadge} 
                activeOpacity={0.7} 
                onPress={() => setCountryModalVisible(true)}
              >
                <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                <View style={{ justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10, color: '#94A3B8', fontWeight: '600' }}>{selectedCountry.name}</Text>
                  <Text style={styles.countryCode}>{selectedCountry.callingCode}</Text>
                </View>
                <Feather name="chevron-down" size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your mobile number"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={sendOtp} disabled={loading}>
              <LinearGradient
                colors={['#0D9488', '#0F766E']}
                style={styles.submitButtonPill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <View style={styles.buttonContentFlex}>
                  <View style={styles.buttonSpacer} />
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Continue with OTP</Text>
                  )}
                  <View style={styles.buttonIconBox}>
                    <Feather name="arrow-right" size={18} color="#FFFFFF" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.inputPill}>
              <TextInput
                style={styles.otpInput}
                placeholder="• • • • • •"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                autoFocus
              />
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={verifyOtp} disabled={loading}>
              <LinearGradient
                colors={['#0D9488', '#0F766E']}
                style={styles.submitButtonPill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <View style={styles.buttonContentFlex}>
                  <View style={styles.buttonSpacer} />
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Verify & Proceed</Text>
                  )}
                  <View style={styles.buttonIconBox}>
                    <Feather name="check" size={18} color="#FFFFFF" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.backButton} onPress={switchToPhoneLogin}>
              <Text style={styles.backButtonText}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Area */}
        <View style={styles.footerArea}>
          <View style={styles.secureContainer}>
            <Feather name="lock" size={12} color="#94A3B8" style={{ marginTop: 1 }} />
            <Text style={styles.secureText}>Your data is safe with us</Text>
          </View>
          <Text style={styles.termsText}>
            By continuing, you agree to our{'\n'}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy.</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Custom Bottom Sheet Country Picker */}
      <Modal
        visible={isCountryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setCountryModalVisible(false)} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <Feather name="x" size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Feather name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country or code"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.countryList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.code === selectedCountry.code;
                return (
                  <TouchableOpacity
                    style={[styles.countryRow, isSelected && styles.countryRowSelected]}
                    onPress={() => {
                      setSelectedCountry(item);
                      setCountryModalVisible(false);
                      setSearchQuery(''); // reset
                    }}
                  >
                    <View style={styles.countryRowLeft}>
                      <Text style={styles.countryRowFlag}>{item.flag}</Text>
                      <Text style={styles.countryRowName}>{item.name}</Text>
                    </View>
                    <View style={styles.countryRowRight}>
                      <Text style={styles.countryRowCode}>{item.callingCode}</Text>
                      {isSelected && (
                        <Feather name="check" size={20} color="#14B8A6" style={{ marginLeft: 12 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#022C22' },
  blob1: {
    position: 'absolute', top: -100, right: -50, width: 300, height: 300,
    borderRadius: 150, backgroundColor: '#14B8A6', opacity: 0.1,
  },
  blob2: {
    position: 'absolute', bottom: -50, left: -100, width: 350, height: 350,
    borderRadius: 175, backgroundColor: '#34D399', opacity: 0.08,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  headerArea: {
    zIndex: 2,
    position: 'absolute',
    top: 60,
    left: 28,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 22,
    fontWeight: '500',
  },
  floatingCardsContainer: {
    alignItems: 'flex-end',
    marginTop: 30,
    marginBottom: 40,
    position: 'relative',
    right: -10,
    height: 200,
  },
  cardBase: {
    width: 175,
    height: 160,
    borderRadius: 24,
    position: 'absolute',
    padding: 12,
  },
  cardBg2: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardBg1: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardMain: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 0,
    justifyContent: 'center',
    gap: 8,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardItemTexts: { flex: 1 },
  cardItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 1,
  },
  cardItemSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  titleArea: {
    marginBottom: 32,
    marginTop: 20, 
  },
  mainHeading: {
    fontSize: 38,
    fontWeight: '900',
    color: '#F8FAFC',
    lineHeight: 44,
    marginBottom: 12,
    letterSpacing: -1,
  },
  subHeading: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: { width: '100%' },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    height: 64,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    height: '100%',
  },
  flagEmoji: {
    fontSize: 22,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 12,
    marginLeft: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  otpInput: {
    flex: 1,
    height: '100%',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    color: '#F8FAFC',
  },
  submitButtonPill: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 0,
  },
  buttonContentFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  buttonSpacer: { width: 44 },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  footerArea: {
    marginTop: 40,
    alignItems: 'center',
  },
  secureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 6,
  },
  secureText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  linkText: {
    color: '#14B8A6',
    fontWeight: '600',
  },

  // Modal Styles (Dark Theme)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: { flex: 1 },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#F8FAFC',
  },
  countryList: { paddingBottom: 40 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryRowSelected: {
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    borderRadius: 12,
    borderBottomWidth: 0,
    paddingHorizontal: 12,
    marginHorizontal: -12,
  },
  countryRowLeft: { flexDirection: 'row', alignItems: 'center' },
  countryRowFlag: { fontSize: 24, marginRight: 12 },
  countryRowName: {
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  countryRowRight: { flexDirection: 'row', alignItems: 'center' },
  countryRowCode: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
