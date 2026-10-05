import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { IconSparkles, IconChevronRight } from '../components/icons/Icons';
import { colors } from '../theme/colors';

interface AiInsightWidgetProps {
  score?: number;
  insightText?: string;
  onExplore?: () => void;
  scale?: number;
}

export function AiInsightWidget({
  score = 88,
  insightText = 'You spent ₹180 less on groceries compared to last week. You are on track to save ₹4,200 by month-end!',
  onExplore,
  scale = 1,
}: AiInsightWidgetProps) {
  return (
    <View style={styles.container}>
      <View style={styles.glassCard}>
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            <View style={styles.iconGlowBox}>
              <IconSparkles size={16} color={colors.primary} />
            </View>
            <Text style={styles.aiTag}>EXPENSIO AI COPILOT</Text>
          </View>

          <View style={styles.scorePill}>
            <View style={styles.scoreDot} />
            <Text style={styles.scoreText}>Health {score}/100</Text>
          </View>
        </View>

        <Text style={[styles.insightText, { fontSize: Math.round(13.5 * scale) }]}>
          {insightText}
        </Text>

        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.7}
          onPress={onExplore}
        >
          <Text style={styles.actionText}>Optimize Your Budgets</Text>
          <IconChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconGlowBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTag: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.emeraldMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  scoreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },
  scoreText: {
    color: colors.emerald,
    fontSize: 11,
    fontWeight: '800',
  },
  insightText: {
    color: colors.textPrimary,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  actionText: {
    color: colors.primary,
    fontSize: 12.5,
    fontWeight: '800',
  },
});
