import React, { useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputKeyPressEvent,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

type InputRef = React.ElementRef<typeof TextInput>;

export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
}: Props) {
  const refs = useRef<Array<InputRef | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const updateAt = (index: number, char: string) => {
    const next = digits.map((d, i) => (i === index ? char : d));
    onChange(next.join('').slice(0, length));
  };

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '');
    if (!cleaned) {
      updateAt(index, '');
      return;
    }

    if (cleaned.length > 1) {
      const merged = (value.slice(0, index) + cleaned).slice(0, length);
      onChange(merged);
      const focusIndex = Math.min(merged.length, length - 1);
      refs.current[focusIndex]?.focus();
      return;
    }

    updateAt(index, cleaned);
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: TextInputKeyPressEvent, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      updateAt(index - 1, '');
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            refs.current[index] = ref;
          }}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={length}
          autoFocus={autoFocus && index === 0}
          selectTextOnFocus
          style={[styles.cell, digit ? styles.cellFilled : null]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.xs,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    width: 0,
    height: 72,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    ...typography.h1,
    fontSize: 28,
    color: colors.textPrimary,
  },
  cellFilled: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
});
