import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, layout, radius, spacing, typography } from '../theme';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  length?: number;
  autoFocus?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  inputRef?: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  cellStyle?: ViewStyle;
}

/**
 * Pure helper for processing OTP input text edits, full-code paste,
 * and clean replacement when editing from a failed 6-digit error state.
 */
export function processOtpTextChange(
  currentValue: string,
  nextRawText: string,
  hasError: boolean,
  length = 6,
): string {
  const cleaned = nextRawText.replace(/\D/g, '');
  if (hasError && currentValue.length === length && cleaned.length > length) {
    // User typed a new digit over a full errored code: start fresh with the new digit(s)
    return cleaned.slice(length, length * 2);
  }
  return cleaned.slice(0, length);
}

function OtpDigitCell({
  digit,
  index,
  length,
  isFilled,
  hasError,
  reduceMotion,
  cellStyle,
}: {
  digit: string;
  index: number;
  length: number;
  isFilled: boolean;
  hasError: boolean;
  reduceMotion: boolean;
  cellStyle?: ViewStyle;
}) {
  const scaleAnim = useRef(new Animated.Value(digit ? 1 : 0.4)).current;
  const opacityAnim = useRef(new Animated.Value(digit ? 1 : 0)).current;
  const fillAnim = useRef(new Animated.Value(isFilled ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      scaleAnim.setValue(digit ? 1 : 0.4);
      opacityAnim.setValue(digit ? 1 : 0);
      return;
    }
    if (digit) {
      scaleAnim.setValue(0.4);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 260,
          friction: 14,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 130,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.4);
      opacityAnim.setValue(0);
    }
  }, [digit, opacityAnim, reduceMotion, scaleAnim]);

  useEffect(() => {
    if (reduceMotion) {
      fillAnim.setValue(isFilled ? 1 : 0);
      return;
    }
    Animated.timing(fillAnim, {
      toValue: isFilled ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [fillAnim, isFilled, reduceMotion]);

  return (
    <View
      accessible={false}
      accessibilityLabel={`Digit ${index + 1} of ${length}`}
      style={[styles.slot, cellStyle]}
    >
      {digit ? (
        <Animated.Text
          style={[
            styles.digit,
            hasError && styles.digitError,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {digit}
        </Animated.Text>
      ) : null}
      <View style={[styles.baseUnderline, hasError && styles.baseUnderlineError]} />
      <Animated.View
        style={[
          styles.filledUnderline,
          hasError && styles.filledUnderlineError,
          { opacity: fillAnim },
        ]}
      />
    </View>
  );
}

/**
 * Shared 6-digit OTP input powered by a single hidden TextInput driving 6 animated slots.
 * Supports full-code paste, iOS/Android SMS OTP autofill, backspace across cells,
 * and screen-reader digit announcements ("Digit X of 6").
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus = true,
  hasError = false,
  disabled = false,
  inputRef: externalRef,
  cellStyle,
}: Props) {
  const localRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const inputRef = externalRef || localRef;
  const [rowWidth, setRowWidth] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const slideAnim = useRef(new Animated.Value(Math.min(value.length, length - 1))).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const targetSlot = Math.min(value.length, length - 1);
    if (reduceMotion) {
      slideAnim.setValue(targetSlot);
      return;
    }
    Animated.spring(slideAnim, {
      toValue: targetSlot,
      tension: 220,
      friction: 18,
      useNativeDriver: true,
    }).start();
  }, [length, reduceMotion, slideAnim, value.length]);

  useEffect(() => {
    if (!isFocused || disabled || reduceMotion) {
      cursorOpacity.setValue(isFocused && !disabled ? 1 : 0);
      return;
    }
    cursorOpacity.setValue(1);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 480, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [cursorOpacity, disabled, isFocused, reduceMotion]);

  const slotGap = spacing.sm;
  const slotWidth = rowWidth > 0 ? (rowWidth - (length - 1) * slotGap) / length : 0;
  const step = slotWidth + slotGap;
  const activeDigitNumber = Math.min(value.length + 1, length);

  return (
    <Pressable
      accessibilityLabel={`Enter ${length}-digit verification code, digit ${activeDigitNumber} of ${length}`}
      accessibilityValue={{ text: `${value.length} of ${length} digits entered` }}
      onPress={() => {
        if (!disabled) inputRef.current?.focus();
      }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setRowWidth(w);
      }}
      style={[styles.slotsRow, disabled && styles.slotsDisabled]}
    >
      {Array.from({ length }, (_, index) => {
        const digit = value[index] ?? '';
        return (
          <OtpDigitCell
            key={index}
            digit={digit}
            index={index}
            length={length}
            isFilled={Boolean(digit)}
            hasError={hasError}
            reduceMotion={reduceMotion}
            cellStyle={cellStyle}
          />
        );
      })}

      {rowWidth > 0 && isFocused && !disabled && value.length < length ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glider,
            {
              width: slotWidth,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: Array.from({ length }, (_, i) => i),
                    outputRange: Array.from({ length }, (_, i) => i * step),
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View style={[styles.gliderCursor, { opacity: cursorOpacity }]} />
          <View style={styles.gliderBar} />
        </Animated.View>
      ) : null}

      <TextInput
        ref={inputRef}
        autoFocus={autoFocus}
        editable={!disabled}
        accessibilityLabel={`Digit ${activeDigitNumber} of ${length}, verification code`}
        accessibilityHint={`Enter or paste your ${length}-digit verification code`}
        value={value}
        onChangeText={(text) => {
          const cleaned = processOtpTextChange(value, text, hasError, length);
          onChange(cleaned);
          if (cleaned.length === length) {
            onComplete?.(cleaned);
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        textContentType="oneTimeCode"
        maxLength={hasError && value.length === length ? length + 1 : length}
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slotsRow: {
    position: 'relative',
    flexDirection: 'row',
    gap: spacing.sm,
    height: layout.stickyBarHeight,
    alignItems: 'stretch',
  },
  slotsDisabled: {
    opacity: 0.55,
  },
  slot: {
    flex: 1,
    minWidth: 0,
    height: layout.stickyBarHeight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  baseUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: radius.xxs,
    backgroundColor: colors.border,
  },
  baseUnderlineError: {
    backgroundColor: colors.dangerBorder,
  },
  filledUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: radius.xxs,
    backgroundColor: colors.accentDark,
  },
  filledUnderlineError: {
    backgroundColor: colors.expense,
  },
  glider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gliderCursor: {
    width: 2,
    height: spacing.lg,
    borderRadius: radius.xxs,
    backgroundColor: colors.accentDark,
  },
  gliderBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: radius.xxs,
    backgroundColor: colors.accentDark,
  },
  digit: {
    ...typography.otpDigit,
    color: colors.accentDark,
    textAlign: 'center',
  },
  digitError: {
    color: colors.expense,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: colors.transparent,
  },
});
