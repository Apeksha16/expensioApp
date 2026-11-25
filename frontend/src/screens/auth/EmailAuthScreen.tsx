import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthHeroShell } from '../../components/AuthHeroShell';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useApp } from '../../context/AppContext';
import { authenticateEmail } from '../../services/authApi';
import { colors, layout, radius, spacing, typography } from '../../theme';
import { normalizeAuthError } from '../../utils/errorNormalization';
import { getPasswordRequirementChecks, validatePasswordPolicy } from '../../utils/validation';

interface EmailAuthAuditPreview {
  mode?: 'login' | 'register';
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  error?: string;
}

export function EmailAuthScreen({ auditPreview }: { auditPreview?: EmailAuthAuditPreview } = {}) {
  const {
    setAuthPhase,
    applyAuthSession,
    beginVerification,
    setPasswordResetEmail,
  } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(auditPreview?.mode ?? 'login');
  const [name, setName] = useState(auditPreview?.name ?? '');
  const [email, setEmail] = useState(auditPreview?.email ?? '');
  const [password, setPassword] = useState(auditPreview?.password ?? '');
  const [confirmPassword, setConfirmPassword] = useState(auditPreview?.confirmPassword ?? '');
  const [error, setError] = useState(auditPreview?.error ?? '');
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const isRegister = mode === 'register';
  const passwordChecks = useMemo(() => getPasswordRequirementChecks(password), [password]);
  const confirmMismatch = isRegister && confirmPassword.length > 0 && password !== confirmPassword;

  const trimmedEmail = email.trim().toLowerCase();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const isFormReady = isRegister
    ? isEmailValid && name.trim().length >= 2 && validatePasswordPolicy(password) === null && password === confirmPassword
    : isEmailValid && password.length > 0;

  const switchMode = (nextMode: 'login' | 'register') => {
    if (loading || nextMode === mode) return;
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const submit = async () => {
    if (loading || isSubmittingRef.current) return;
    if (!isEmailValid) {
      setError('Enter a valid email address.');
      return;
    }
    if (isRegister) {
      if (name.trim().length < 2) {
        setError('Full name must be at least 2 characters.');
        return;
      }
      const passwordError = validatePasswordPolicy(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else if (!password) {
      setError('Password is required.');
      return;
    }

    isSubmittingRef.current = true;
    setError('');
    setLoading(true);
    try {
      const result = await authenticateEmail(trimmedEmail, password, mode, name.trim());
      if (isRegister) {
        await beginVerification(result, 'email', trimmedEmail);
      } else {
        await applyAuthSession({ ...result, verifiedChannel: 'email' });
      }
    } catch (requestError) {
      setError(normalizeAuthError(requestError, isRegister ? 'signup' : 'login').message);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const modeOptions = [
    { key: 'login' as const, label: 'Log in' },
    { key: 'register' as const, label: 'Sign up' },
  ];

  return (
    <AuthHeroShell
      onBack={() => setAuthPhase('login')}
      backAccessibilityLabel="Back to auth options"
      step={1}
      totalSteps={isRegister ? 2 : 1}
      icon={isRegister ? 'person-add-outline' : 'lock-closed-outline'}
      titleLine1={isRegister ? 'Create your' : 'Welcome'}
      titleAccent={isRegister ? 'account' : 'back'}
      subtitle={
        isRegister
          ? 'Set up your email and a strong password to get started.'
          : 'Sign in with your registered email and password.'
      }
      footer={(
        <>
          <PrimaryButton
            title={isRegister ? 'Create account' : 'Log in'}
            variant="lime"
            surface="dark"
            loading={loading}
            disabled={!isFormReady || loading}
            onPress={() => void submit()}
            style={styles.submitButton}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => switchMode(isRegister ? 'login' : 'register')}
            style={styles.switchBtn}
          >
            <Text style={styles.switchText}>
              {isRegister
                ? 'Already have an account? Log in'
                : 'New to Expensio? Create an account'}
            </Text>
          </Pressable>
        </>
      )}
    >
      <SegmentedControl
        options={modeOptions}
        value={mode}
        variant="primary"
        onChange={switchMode}
      />

      <View style={styles.form}>
        {isRegister ? (
          <InputField
            label="Full name"
            value={name}
            onChangeText={(value) => { setName(value.slice(0, 100)); setError(''); }}
            placeholder="e.g. Ananya Verma"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={100}
            returnKeyType="next"
          />
        ) : null}

        <InputField
          label="Email address"
          value={email}
          onChangeText={(value) => { setEmail(value.slice(0, 254)); setError(''); }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType={isRegister ? 'emailAddress' : 'username'}
          maxLength={254}
          returnKeyType="next"
        />

        <View style={styles.passwordGroup}>
          <InputField
            label="Password"
            value={password}
            onChangeText={(value) => { setPassword(value.slice(0, 128)); setError(''); }}
            placeholder={isRegister ? 'Create a strong password' : 'Enter your password'}
            secureTextEntry
            showPasswordToggle
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            textContentType={isRegister ? 'newPassword' : 'password'}
            maxLength={128}
            returnKeyType={isRegister ? 'next' : 'done'}
            onSubmitEditing={!isRegister ? () => void submit() : undefined}
          />

          {!isRegister ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              onPress={() => {
                setPasswordResetEmail(trimmedEmail);
                setAuthPhase('forgot_password');
              }}
              style={styles.forgotLinkWrap}
            >
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </Pressable>
          ) : null}
        </View>

        {isRegister ? (
          <>
            <View style={styles.checklist} accessibilityLabel="Password requirements">
              {passwordChecks.map((item) => (
                <View key={item.id} style={styles.checkRow}>
                  <Ionicons
                    name={item.met ? 'checkmark-circle' : 'ellipse-outline'}
                    size={15}
                    color={item.met ? colors.income : colors.textTertiary}
                  />
                  <Text style={[styles.checkLabel, item.met && styles.checkLabelMet]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <InputField
              label="Confirm password"
              value={confirmPassword}
              onChangeText={(value) => { setConfirmPassword(value.slice(0, 128)); setError(''); }}
              placeholder="Re-enter your password"
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              maxLength={128}
              returnKeyType="done"
              error={confirmMismatch ? 'Passwords do not match.' : undefined}
              onSubmitEditing={() => void submit()}
            />
          </>
        ) : null}

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={18} color={colors.expense} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>
    </AuthHeroShell>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  passwordGroup: {
    gap: spacing.xxs,
  },
  forgotLinkWrap: {
    alignSelf: 'flex-end',
    minHeight: layout.headerButtonSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
  },
  forgotLink: {
    ...typography.captionMedium,
    color: colors.accent,
    fontWeight: '700',
  },
  checklist: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  checkLabelMet: {
    color: colors.accentDark,
    fontWeight: '600',
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
  submitButton: {
    minHeight: layout.authButtonHeight,
  },
  switchBtn: {
    minHeight: layout.headerButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchText: {
    ...typography.bodyMedium,
    color: colors.heroText,
    textDecorationLine: 'underline',
  },
});
