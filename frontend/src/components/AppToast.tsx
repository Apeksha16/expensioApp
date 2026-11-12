import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, typography } from '../theme';

export interface ToastMessage {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

export function AppToast({ toast }: { toast: ToastMessage | null }) {
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  const isError = toast.kind === 'error';

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + spacing.sm }]}>
      <View
        accessibilityRole={isError ? 'alert' : 'status'}
        accessibilityLiveRegion={isError ? 'assertive' : 'polite'}
        key={toast.id}
        style={[styles.toast, isError ? styles.errorToast : styles.successToast]}
      >
        <Ionicons
          name={isError ? 'alert-circle' : 'checkmark-circle'}
          size={20}
          color={isError ? colors.expense : colors.income}
        />
        <Text style={styles.message}>{toast.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 520,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  successToast: { borderColor: colors.accentMuted },
  errorToast: { borderColor: '#F1C3C6' },
  message: { flex: 1, ...typography.captionMedium, color: colors.textPrimary },
});
