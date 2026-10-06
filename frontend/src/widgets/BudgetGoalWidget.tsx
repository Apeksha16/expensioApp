import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { IconTarget } from '../components/icons/Icons';
import { colors } from '../theme/colors';

interface BudgetGoalWidgetProps {
  title?: string;
  target?: string;
  saved?: string;
  percent?: number;
  daysRemaining?: number;
  onPress?: () => void;
  scale?: number;
}

export function BudgetGoalWidget({
  title = 'MacBook Pro M4',
  target = '₹1,00,000',
  saved = '₹68,000',
  percent = 68,
  daysRemaining = 42,
  onPress,
  scale = 1,
}: BudgetGoalWidgetProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.glassCard}
        activeOpacity={0.85}
        onPress={onPress}
      >
        <View style={styles.topRow}>
          <View style={styles.iconBox}>
            <IconTarget size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.goalTag}>SAVINGS GOAL</Text>
            <Text style={[styles.goalTitle, { fontSize: Math.round(15 * scale) }]}>
              {title}
            </Text>
          </View>
          <View style={styles.badgeDays}>
            <Text style={styles.badgeDaysText}>{daysRemaining}d left</Text>
          </View>
        </View>

        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${percent}%` },
            ]}
          />
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.savedText}>
            Saved <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{saved}</Text>
          </Text>
          <Text style={styles.targetText}>
            {percent}% of {target}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  glassCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTag: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  goalTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  badgeDays: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeDaysText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  barTrack: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  targetText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
