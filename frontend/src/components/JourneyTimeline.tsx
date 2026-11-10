import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface Step {
  label: string;
}

interface Props {
  steps: Step[];
  current: number;
}

export function JourneyTimeline({ steps, current }: Props) {
  return (
    <View style={styles.row}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const complete = stepNumber < current;
        const active = stepNumber === current;
        const reached = complete || active;

        return (
          <View key={step.label} style={styles.step}>
            <View style={styles.trackRow}>
              <View
                style={[
                  styles.line,
                  index === 0
                    ? styles.lineHidden
                    : reached && styles.lineReached,
                ]}
              />
              <View
                style={[
                  styles.node,
                  complete && styles.nodeComplete,
                  active && styles.nodeActive,
                ]}
              >
                {complete ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : null}
                {active ? <View style={styles.core} /> : null}
              </View>
              <View
                style={[
                  styles.line,
                  index === steps.length - 1
                    ? styles.lineHidden
                    : complete && styles.lineReached,
                ]}
              />
            </View>
            <Text style={[styles.label, reached && styles.labelReached]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  trackRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 3,
    backgroundColor: '#D7DDD6',
    borderRadius: radius.full,
  },
  lineHidden: {
    backgroundColor: 'transparent',
  },
  lineReached: {
    backgroundColor: colors.accent,
  },
  node: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: '#D7DDD6',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeComplete: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  nodeActive: {
    borderColor: colors.accent,
    backgroundColor: colors.background,
  },
  core: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  label: {
    ...typography.captionMedium,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  labelReached: {
    color: colors.accent,
    fontWeight: '700',
  },
});
