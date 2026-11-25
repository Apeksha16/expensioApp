import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthHeroShell } from '../../components/AuthHeroShell';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useApp } from '../../context/AppContext';
import { requestPasswordReset } from '../../services/authApi';
import { colors, layout, radius, spacing, typography } from '../../theme';
import { normalizeAuthError } from '../../utils/errorNormalization';

export function ForgotPasswordScreen() {
  const {
    passwordResetEmail,
    setPasswordResetEmail,
    setAuthPhase,
  } = useApp();

  const [email, setEmail] = useState(passwordResetEmail || '');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const normalizedEmail = email.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  const submit = async () => {
    if (loading || isSubmittingRef.current) return;
    if (!isValidEmail) {
      setError('Enter a valid email address.');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError('');
    try {
      await requestPasswordReset(normalizedEmail);
      setPasswordResetEmail(normalizedEmail);
      setConfirmation('If an account exists for that email, we sent reset instructions.');
      setAuthPhase('reset_password');
    } catch (requestError) {
      setError(normalizeAuthError(requestError, 'recovery').message);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <AuthHeroShell
      onBack={() => setAuthPhase('email')}
      backAccessibilityLabel="Back to email login"
      step={1}
      totalSteps={2}
      icon="key-outline"
      titleLine1="Recover your"
      titleAccent="password"
      subtitle="Enter your email address and we'll send instructions to reset your password."
      footer={(
        <PrimaryButton
          title="Send reset instructions"
          variant="lime"
          surface="dark"
          loading={loading}
          disabled={!isValidEmail || loading}
          onPress={() => void submit()}
          style={styles.ctaButton}
        />
      )}
    >
      <InputField
        label="Email address"
        value={email}
        onChangeText={(value) => {
          setEmail(value.slice(0, 254));
          setError('');
          setConfirmation('');
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        maxLength={254}
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
      />

      <Text style={styles.helper}>
        For your security, we never confirm whether an email address is registered.
      </Text>

      {confirmation ? (
        <View style={styles.infoBox} accessibilityRole="alert">
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent} />
          <Text style={styles.infoText}>{confirmation}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={18} color={colors.expense} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </AuthHeroShell>
  );
}

const styles = StyleSheet.create({
  helper: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  infoText: {
    ...typography.captionMedium,
    color: colors.accentDark,
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.expense,
    flex: 1,
  },
  ctaButton: {
    minHeight: layout.buttonHeight,
  },
});
