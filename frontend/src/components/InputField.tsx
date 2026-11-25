import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, layout, radius, spacing, typography } from '../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  fieldStyle?: object;
  showPasswordToggle?: boolean;
}

export const InputField = forwardRef<React.ElementRef<typeof TextInput>, Props>(function InputField(
  {
    label,
    error,
    leftElement,
    rightElement,
    fieldStyle,
    style,
    secureTextEntry,
    showPasswordToggle = Boolean(secureTextEntry),
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const effectiveSecureTextEntry = Boolean(secureTextEntry) && !revealed;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          fieldStyle,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}
      >
        {leftElement}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={effectiveSecureTextEntry}
          style={[styles.input, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />
        {showPasswordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            accessibilityState={{ checked: revealed }}
            onPress={() => setRevealed((prev) => !prev)}
            hitSlop={4}
            style={({ pressed }) => [styles.eyeButton, pressed && styles.eyePressed]}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
        {rightElement}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  field: {
    minHeight: layout.inputHeight,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fieldFocused: {
    borderColor: colors.accentDark,
  },
  fieldError: {
    borderColor: colors.expense,
  },
  input: {
    flex: 1,
    minWidth: 0,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  eyeButton: {
    width: layout.headerButtonSize,
    height: layout.headerButtonSize,
    marginRight: -spacing.xs,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyePressed: {
    backgroundColor: colors.surfaceMuted,
  },
  error: {
    ...typography.caption,
    color: colors.expense,
  },
});
