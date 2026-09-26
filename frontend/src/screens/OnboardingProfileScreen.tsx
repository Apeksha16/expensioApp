import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { IconSparkles, IconCheck } from '../components/icons/Icons';
import { haptics } from '../services/haptics';
import { api } from '../services/api';
import { secureStore, SECURE_KEYS } from '../services/secureStore';

interface OnboardingProfileScreenProps {
  initialUser?: any;
  onCompleted: (user: any) => void;
}

const AVATAR_OPTIONS = [
  { id: 'avatar_1', name: 'Apex', emoji: '⚡' },
  { id: 'avatar_2', name: 'Cyber', emoji: '🤖' },
  { id: 'avatar_3', name: 'Nova', emoji: '💎' },
  { id: 'avatar_4', name: 'Titan', emoji: '🛡️' },
  { id: 'avatar_5', name: 'Quantum', emoji: '🚀' },
  { id: 'avatar_6', name: 'Zen', emoji: '✨' },
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
      setError('Please choose a handle/username');
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.stepBadge}>
            <IconSparkles size={16} color={colors.primary} />
            <Text style={styles.stepBadgeText}>PHASE 2 • ONBOARDING</Text>
          </View>

          <Text style={styles.title}>Set Up Your Profile</Text>
          <Text style={styles.subtitle}>
            Personalize your Expensio identity and monthly spending target to
            unlock automated budgeting.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Avatar Selector */}
          <Text style={styles.sectionLabel}>CHOOSE YOUR AVATAR</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((item) => {
              const isSelected = avatarId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.avatarItem,
                    isSelected && styles.avatarItemSelected,
                  ]}
                  onPress={() => handleSelectAvatar(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.avatarEmoji}>{item.emoji}</Text>
                  <Text
                    style={[
                      styles.avatarName,
                      isSelected && styles.avatarNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkPill}>
                      <IconCheck size={10} color={colors.textDark} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Username Input */}
          <Text style={styles.sectionLabel}>YOUR HANDLE / USERNAME</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.textInput}
              placeholder="username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
            />
          </View>

          {/* Salary Limit / Budget */}
          <Text style={styles.sectionLabel}>MONTHLY SALARY / SPEND LIMIT (₹)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.textInput}
              placeholder="50000"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={salary}
              onChangeText={setSalary}
            />
          </View>

          {/* Quick Preset Chips */}
          <View style={styles.presetRow}>
            {SALARY_PRESETS.map((amt) => {
              const isSelected = salary === String(amt);
              return (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.presetChip,
                    isSelected && styles.presetChipSelected,
                  ]}
                  onPress={() => handleSelectPreset(amt)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      isSelected && styles.presetTextSelected,
                    ]}
                  >
                    ₹{(amt / 1000).toFixed(0)}k
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={styles.submitButtonText}>
                Complete Profile & Continue →
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 229, 168, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 168, 0.25)',
    marginBottom: spacing.md,
  },
  stepBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.lg,
  },
  avatarItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarItemSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 168, 0.08)',
  },
  avatarEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  avatarName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  avatarNameSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  checkPill: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    width: '100%',
    height: 48,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  atSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: spacing.xs,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    width: '100%',
    marginBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  presetChip: {
    flex: 1,
    paddingVertical: 7,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  presetChipSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 168, 0.15)',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  presetTextSelected: {
    color: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitButtonText: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: '800',
  },
});
