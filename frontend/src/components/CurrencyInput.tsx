import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { formatINRInput, parseINRInput } from '../utils/format';
import { InputField } from './InputField';

interface Props {
  label: string;
  value: number;
  onChangeValue: (value: number) => void;
  hint?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  materialIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  variant?: 'inline' | 'card';
}

export function CurrencyInput({
  label,
  value,
  onChangeValue,
  hint,
  error,
  icon = 'wallet-outline',
  materialIcon,
  variant = 'inline',
}: Props) {
  const display = value > 0 ? formatINRInput(String(value)) : '';

  if (variant === 'card') {
    return (
      <View style={[styles.card, error ? styles.cardError : null]}>
        <View style={styles.iconBox}>
          {materialIcon ? (
            <MaterialCommunityIcons name={materialIcon} size={20} color={colors.accent} />
          ) : (
            <Ionicons name={icon} size={20} color={colors.accent} />
          )}
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.cardLabel}>{label}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.cardCurrency}>₹</Text>
            <TextInput
              value={display}
              onChangeText={(text) => onChangeValue(parseINRInput(text))}
              keyboardType="number-pad"
              inputMode="numeric"
              returnKeyType="done"
              selectTextOnFocus={false}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              style={styles.cardInput}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <InputField
        label={label}
        value={display}
        onChangeText={(text) => onChangeValue(parseINRInput(text))}
        keyboardType="numeric"
        placeholder="0"
        error={error}
        leftElement={
          <View style={styles.leading}>
            <Ionicons name={icon} size={22} color={colors.accent} />
            <Text style={styles.currency}>₹</Text>
          </View>
        }
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  currency: {
    ...typography.h3,
    color: colors.textPrimary,
    marginRight: spacing.xxs,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginLeft: spacing.xxs,
  },
  card: {
    minHeight: 66,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardError: {
    borderColor: colors.expense,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardCurrency: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.accent,
    marginRight: 6,
  },
  cardInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: colors.accent,
    paddingVertical: 0,
  },
});
