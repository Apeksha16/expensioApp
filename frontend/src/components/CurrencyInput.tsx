import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { formatINRInput, parseINRInput } from '../utils/format';
import { InputField } from './InputField';

interface Props {
  label: string;
  value: number;
  onChangeValue: (value: number) => void;
  hint?: string;
  error?: string;
}

export function CurrencyInput({
  label,
  value,
  onChangeValue,
  hint,
  error,
}: Props) {
  const display = value > 0 ? formatINRInput(String(value)) : '';

  return (
    <View style={styles.wrap}>
      <InputField
        label={label}
        value={display}
        onChangeText={(text) => onChangeValue(parseINRInput(text))}
        keyboardType="numeric"
        placeholder="0"
        error={error}
        leftElement={<Text style={styles.currency}>₹</Text>}
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
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginLeft: spacing.xxs,
  },
});
