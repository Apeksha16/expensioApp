import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../services/haptics';
import { api } from '../services/api';
import { secureStore, SECURE_KEYS } from '../services/secureStore';

interface OnboardingProfileScreenProps {
  initialUser?: any;
  onCompleted: (user: any) => void;
}

interface AvatarOption {
  id: string;
  name: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  bg: string;
}

const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'avatar_1', name: 'Apex', title: 'Optimizer', icon: 'zap', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'avatar_2', name: 'Cyber', title: 'Automator', icon: 'cpu', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'avatar_3', name: 'Nova', title: 'Visionary', icon: 'award', color: '#06B6D4', bg: '#ECFEFF' },
  { id: 'avatar_4', name: 'Titan', title: 'Guardian', icon: 'shield', color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'avatar_5', name: 'Quantum', title: 'Catalyst', icon: 'send', color: '#EF4444', bg: '#FFF1F2' },
  { id: 'avatar_6', name: 'Zen', title: 'Mindful', icon: 'star', color: '#10B981', bg: '#ECFDF5' },
];

const SALARY_PRESETS = [30000, 50000, 75000, 100000, 150000];

export function OnboardingProfileScreen({
  initialUser,
  onCompleted,
}: OnboardingProfileScreenProps) {
  const [username, setUsername] = useState(
    initialUser?.username ? initialUser.username.replace('@', '') : 'apeksha'
  );
  const [salary, setSalary] = useState(
    initialUser?.salary ? String(initialUser.salary) : '31627'
  );
  const [avatarId, setAvatarId] = useState(initialUser?.avatarId || 'avatar_1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHandleFocused, setIsHandleFocused] = useState(false);
  const [isSalaryFocused, setIsSalaryFocused] = useState(false);

  const usernameInputRef = useRef<TextInput>(null);
  const salaryInputRef = useRef<TextInput>(null);

  const selectedAvatar =
    AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];

  const parsedSalary = parseFloat(salary) || 0;
  const dailyAllowance = Math.round(parsedSalary / 30);
  const savingsBuffer = Math.round(parsedSalary * 0.2);

  const handleSelectAvatar = async (id: string) => {
    await haptics.selection();
    setAvatarId(id);
  };

  const handleSelectPreset = async (amount: number) => {
    await haptics.selection();
    setSalary(String(amount));
  };

  const handleSave = async () => {
    if (!username.trim()) {
      await haptics.error();
      setError('Please choose a handle / username');
      return;
    }
    const salaryNum = parseFloat(salary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      await haptics.error();
      setError('Please set a valid monthly budget / salary');
      return;
    }

    setError('');
    setLoading(true);
    await haptics.light();

    try {
      const cleanUsername = username.trim().startsWith('@')
        ? username.trim()
        : `@${username.trim()}`;

      const res = await api.updateProfile({
        username: cleanUsername,
        salary: salaryNum,
        avatarId,
        name: initialUser?.name || 'Apeksha Verma',
      });

      await haptics.success();
      const updatedUser = res?.user || {
        ...initialUser,
        username: cleanUsername,
        salary: salaryNum,
        avatarId,
      };

      await secureStore.setItem(
        SECURE_KEYS.USER_PROFILE,
        JSON.stringify(updatedUser)
      );

      onCompleted(updatedUser);
    } catch (e: any) {
      console.warn('Profile onboarding error:', e);
      setError('Failed to update profile. Please try again.');
      await haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* Luminous Multi-Tone Gradient Background */}
      <LinearGradient
        colors={['#EDF4FF', '#F8FAFC', '#EBF2FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle Ambient Glow Orbs for Depth */}
      <View style={styles.glowOrbTop} />
      <View style={styles.glowOrbBottom} />

      <View style={styles.container}>
        {/* Top Header Block */}
        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brandTitle}>Expensio</Text>
              <Text style={styles.brandSubtitle}>Personalized Space Setup</Text>
            </View>
            <View style={styles.stepBadge}>
              <View style={styles.stepDot} />
              <Text style={styles.stepBadgeText}>Step 2 of 2</Text>
            </View>
          </View>
          <Text style={styles.mainHeading}>Set up your profile</Text>
          <Text style={styles.subHeading}>
            Choose your avatar identity and monthly spending target.
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Central Widget Deck */}
        <View style={styles.widgetDeck}>
          {/* WIDGET 1: Identity & Avatar Studio Widget */}
          <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <View style={styles.widgetTagPill}>
                <Feather name="user-check" size={11} color="#4C80F1" />
                <Text style={styles.widgetTagText}>IDENTITY PASS</Text>
              </View>
              <Text style={styles.avatarPersonaTag}>
                {selectedAvatar.name} • {selectedAvatar.title}
              </Text>
            </View>

            {/* Interactive User Handle Input Row */}
            <TouchableOpacity
              activeOpacity={0.95}
              style={[
                styles.identityInputRow,
                isHandleFocused && styles.identityInputRowFocused,
              ]}
              onPress={() => {
                haptics.selection();
                usernameInputRef.current?.focus();
              }}
            >
              <View
                style={[
                  styles.avatarHeroCircle,
                  { backgroundColor: selectedAvatar.bg, borderColor: selectedAvatar.color },
                ]}
              >
                <Feather name={selectedAvatar.icon} size={20} color={selectedAvatar.color} />
              </View>

              <View style={styles.handleInputBox}>
                <Text style={[styles.atSymbol, isHandleFocused && { color: '#4C80F1' }]}>@</Text>
                <TextInput
                  ref={usernameInputRef}
                  style={styles.handleTextInput}
                  placeholder="choose-handle"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                  selectTextOnFocus={true}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setIsHandleFocused(true)}
                  onBlur={() => setIsHandleFocused(false)}
                  returnKeyType="done"
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  haptics.selection();
                  if (isHandleFocused) {
                    usernameInputRef.current?.blur();
                  } else {
                    usernameInputRef.current?.focus();
                  }
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.editActionBtn}
              >
                <Feather
                  name={isHandleFocused ? 'check' : 'edit-2'}
                  size={14}
                  color={isHandleFocused ? '#4C80F1' : '#64748B'}
                />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Avatar Selector Dock */}
            <View style={styles.avatarDockRow}>
              {AVATAR_OPTIONS.map((item) => {
                const isSelected = avatarId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.avatarDockItem}
                    onPress={() => handleSelectAvatar(item.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.avatarDockBubble,
                        { backgroundColor: item.bg },
                        isSelected && { borderColor: '#4C80F1', borderWidth: 2.5, backgroundColor: '#EFF6FF' },
                      ]}
                    >
                      <Feather
                        name={item.icon}
                        size={18}
                        color={isSelected ? '#4C80F1' : item.color}
                      />
                      {isSelected && (
                        <View style={styles.miniCheckBadge}>
                          <Feather name="check" size={7} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.avatarDockLabel,
                        isSelected && styles.avatarDockLabelSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* WIDGET 2: Smart Budget Target & Allocation Widget */}
          <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <View style={styles.widgetTagPill}>
                <Feather name="target" size={11} color="#4C80F1" />
                <Text style={styles.widgetTagText}>BUDGET & SPEND LIMIT</Text>
              </View>
              <Text style={styles.widgetMetricHighlight}>
                Target: ₹{parsedSalary.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Interactive Salary Limit Input Pill */}
            <TouchableOpacity
              activeOpacity={0.95}
              style={[
                styles.budgetInputRow,
                isSalaryFocused && styles.budgetInputRowFocused,
              ]}
              onPress={() => {
                haptics.selection();
                salaryInputRef.current?.focus();
              }}
            >
              <View style={[styles.currencyBadge, isSalaryFocused && styles.currencyBadgeFocused]}>
                <Text style={[styles.currencyBadgeText, isSalaryFocused && { color: '#FFFFFF' }]}>₹</Text>
              </View>
              <TextInput
                ref={salaryInputRef}
                style={styles.budgetTextInput}
                placeholder="50000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                editable={true}
                selectTextOnFocus={true}
                value={salary}
                onChangeText={setSalary}
                onFocus={() => setIsSalaryFocused(true)}
                onBlur={() => setIsSalaryFocused(false)}
                returnKeyType="done"
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  haptics.selection();
                  if (isSalaryFocused) {
                    salaryInputRef.current?.blur();
                  } else {
                    salaryInputRef.current?.focus();
                  }
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.editActionBtn}
              >
                <Feather
                  name={isSalaryFocused ? 'check' : 'edit-2'}
                  size={14}
                  color={isSalaryFocused ? '#4C80F1' : '#94A3B8'}
                />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Quick Preset Chips */}
            <View style={styles.presetChipRow}>
              {SALARY_PRESETS.map((amt) => {
                const isSelected = salary === String(amt);
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.presetPill,
                      isSelected && styles.presetPillSelected,
                    ]}
                    onPress={() => handleSelectPreset(amt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetPillText,
                        isSelected && styles.presetPillTextSelected,
                      ]}
                    >
                      ₹{(amt / 1000).toFixed(0)}k
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Smart Dual-Metric Allocation Breakdown */}
            <View style={styles.allocationCard}>
              <View style={styles.allocationRow}>
                <View style={styles.allocationCol}>
                  <View style={styles.allocationLabelRow}>
                    <Feather name="calendar" size={12} color="#3B82F6" />
                    <Text style={styles.allocationLabel}>Daily Buffer</Text>
                  </View>
                  <Text style={styles.allocationValue}>₹{dailyAllowance.toLocaleString('en-IN')}/day</Text>
                </View>

                <View style={styles.allocationDivider} />

                <View style={styles.allocationCol}>
                  <View style={styles.allocationLabelRow}>
                    <Feather name="shield" size={12} color="#10B981" />
                    <Text style={styles.allocationLabel}>Savings (20%)</Text>
                  </View>
                  <Text style={[styles.allocationValue, { color: '#10B981' }]}>
                    ₹{savingsBuffer.toLocaleString('en-IN')}/mo
                  </Text>
                </View>
              </View>

              {/* Visual Dual-Tone Progress Tracker */}
              <View style={styles.progressTrackBg}>
                <View style={styles.progressSpendFill} />
                <View style={styles.progressSaveFill} />
              </View>
            </View>
          </View>
        </View>

        {/* Bottom CTA Block */}
        <View style={styles.bottomBlock}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={loading}
          >
            <View style={styles.submitButtonPill}>
              <View style={styles.buttonContentFlex}>
                <View style={styles.buttonSpacer} />
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Activate Profile & Continue
                  </Text>
                )}
                <View style={styles.buttonIconBox}>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.footerNote}>
            <Feather name="lock" size={11} color="#94A3B8" />
            <Text style={styles.footerNoteText}>
              Bank-grade 256-bit encryption • 100% private
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F7FB',
  },
  glowOrbTop: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(76, 128, 241, 0.12)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 229, 168, 0.08)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 48 : 34,
    paddingBottom: Platform.OS === 'ios' ? 22 : 16,
    justifyContent: 'space-between',
  },
  headerBlock: {
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 6,
    shadowColor: '#4C80F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4C80F1',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4C80F1',
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subHeading: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 2,
  },
  widgetDeck: {
    gap: 12,
  },
  widgetCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#4C80F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  widgetTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 7,
  },
  widgetTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4C80F1',
    letterSpacing: 0.7,
  },
  avatarPersonaTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  widgetMetricHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4C80F1',
  },
  identityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  identityInputRowFocused: {
    borderColor: '#4C80F1',
    backgroundColor: '#FFFFFF',
    shadowColor: '#4C80F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarHeroCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  handleInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  atSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94A3B8',
    marginRight: 4,
  },
  handleTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 0,
  },
  editActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  avatarDockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  avatarDockItem: {
    alignItems: 'center',
    width: 44,
  },
  avatarDockBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  miniCheckBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#4C80F1',
    borderRadius: 6,
    width: 13,
    height: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarDockLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  avatarDockLabelSelected: {
    color: '#4C80F1',
    fontWeight: '800',
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    height: 46,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  budgetInputRowFocused: {
    borderColor: '#4C80F1',
    backgroundColor: '#FFFFFF',
    shadowColor: '#4C80F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  currencyBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  currencyBadgeFocused: {
    backgroundColor: '#4C80F1',
  },
  currencyBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4C80F1',
  },
  budgetTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 0,
  },
  presetChipRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    alignItems: 'center',
  },
  presetPillSelected: {
    backgroundColor: '#4C80F1',
    shadowColor: '#4C80F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  presetPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  allocationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  allocationCol: {
    flex: 1,
  },
  allocationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  allocationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  allocationValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  allocationDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  progressTrackBg: {
    height: 4,
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressSpendFill: {
    height: '100%',
    width: '80%',
    backgroundColor: '#4C80F1',
  },
  progressSaveFill: {
    height: '100%',
    width: '20%',
    backgroundColor: '#10B981',
  },
  bottomBlock: {
    width: '100%',
    marginTop: 6,
  },
  submitButtonPill: {
    height: 50,
    borderRadius: 24,
    backgroundColor: '#4C80F1',
    justifyContent: 'center',
    shadowColor: '#5C93FA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonContentFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  buttonSpacer: { width: 34 },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerNoteText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
