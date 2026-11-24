import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
  currencySymbol?: string;
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
  currencySymbol = '₹',
  icon = 'wallet-outline',
  materialIcon,
  variant = 'inline',
}: Props) {
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const display = value > 0 ? formatINRInput(String(value)) : '';

  useEffect(() => {
    if (!focused) {
      cursorOpacity.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [cursorOpacity, focused]);

  if (variant === 'card') {
    return (
      <Pressable
        onPress={() => inputRef.current?.focus()}
        accessibilityRole="button"
        accessibilityLabel={`${label} input field`}
        style={[styles.card, error ? styles.cardError : null]}
      >
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
            <Text style={styles.cardCurrency}>{currencySymbol}</Text>
            <View style={styles.inputDisplayContainer}>
              <Text style={styles.cardInputText}>
                {display ? (
                  <Text style={styles.cardInputValue}>{display}</Text>
                ) : (
                  <Text style={styles.cardInputPlaceholder}>0</Text>
                )}
              </Text>
              {focused ? (
                <Animated.View style={[styles.cursor, { opacity: cursorOpacity }]} />
              ) : null}
              <TextInput
                ref={inputRef}
                value={display}
                onChangeText={(text) => onChangeValue(parseINRInput(text))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="numeric"
                caretHidden={true}
                selectTextOnFocus={false}
                autoCorrect={false}
                spellCheck={false}
                style={styles.transparentInput}
              />
            </View>
          </View>
        </View>
      </Pressable>
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
            <Text style={styles.currency}>{currencySymbol}</Text>
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
  inputDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
    height: 28,
  },
  cardInputText: {
    fontSize: 20,
    fontWeight: '800',
    paddingVertical: 0,
  },
  cardInputValue: {
    color: colors.accent,
  },
  cardInputPlaceholder: {
    color: colors.textTertiary,
  },
  cursor: {
    width: 2,
    height: 20,
    backgroundColor: colors.accent,
    marginLeft: 2,
    borderRadius: 1,
  },
  transparentInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'transparent',
    backgroundColor: 'transparent',
    fontSize: 20,
    fontWeight: '800',
    paddingVertical: 0,
  },
});
