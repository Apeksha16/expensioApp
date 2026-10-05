import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { IconTrendUp, IconTrendDown } from '../components/icons/Icons';
import { colors } from '../theme/colors';

export type AccountType = 'salary' | 'cash' | 'savings';

export interface AccountData {
  title: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  centerLabel: string;
  amount: string;
  stat1Label: string;
  stat1Value: string;
  stat1IsPositive: boolean;
  stat2Label: string;
  stat2Value: string;
  arcColor: string;
  dotColor: string;
  progress: number;
}

interface AccountGaugeWidgetProps {
  currentAccount: AccountType;
  accountData: AccountData;
  onSelectAccount: (type: AccountType) => void;
  scale?: number;
  contentMaxWidth?: number;
}

export function AccountGaugeWidget({
  currentAccount,
  accountData,
  onSelectAccount,
  scale = 1,
  contentMaxWidth = 390,
}: AccountGaugeWidgetProps) {
  const gaugeRadius = Math.round(Math.min(Math.max(contentMaxWidth * 0.28, 92), 118));
  const gaugeDiameter = gaugeRadius * 2;
  const strokeWidth = Math.round(gaugeRadius * 0.10); // Crisp, refined 10-11px ring

  const r = gaugeRadius - strokeWidth / 2;
  const arcLength = Math.PI * r;
  const clampedProgress = Math.min(Math.max(accountData.progress, 0.02), 0.98);
  const strokeDashoffset = arcLength * (1 - clampedProgress);

  const angle = Math.PI * clampedProgress;
  const knobX = gaugeRadius - r * Math.cos(angle);
  const knobY = gaugeRadius - r * Math.sin(angle);
  const knobR = Math.round(strokeWidth * 0.7);

  const renderArc = () => {
    if (Platform.OS === 'web') {
      return React.createElement(
        'svg',
        {
          width: gaugeDiameter,
          height: gaugeRadius + strokeWidth + 4,
          viewBox: `0 0 ${gaugeDiameter} ${gaugeRadius + strokeWidth + 4}`,
          style: { overflow: 'visible', display: 'block', margin: '0 auto' },
        },
        React.createElement(
          'defs',
          null,
          React.createElement(
            'linearGradient',
            { id: 'mintToCyanGradient', x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
            React.createElement('stop', { offset: '0%', stopColor: colors.primary }),
            React.createElement('stop', { offset: '100%', stopColor: colors.secondary })
          )
        ),
        // Base track
        React.createElement('path', {
          d: `M ${strokeWidth / 2} ${gaugeRadius} A ${r} ${r} 0 0 1 ${gaugeDiameter - strokeWidth / 2} ${gaugeRadius}`,
          fill: 'none',
          stroke: 'rgba(255, 255, 255, 0.07)',
          strokeWidth: strokeWidth,
          strokeLinecap: 'round',
        }),
        // Crisp Progress arc - Zero blur/neon glow
        React.createElement('path', {
          d: `M ${strokeWidth / 2} ${gaugeRadius} A ${r} ${r} 0 0 1 ${gaugeDiameter - strokeWidth / 2} ${gaugeRadius}`,
          fill: 'none',
          stroke: 'url(#mintToCyanGradient)',
          strokeWidth: strokeWidth,
          strokeLinecap: 'round',
          strokeDasharray: `${arcLength} ${arcLength}`,
          strokeDashoffset: strokeDashoffset,
        }),
        // Clean indicator knob (Minimalist white dot with subtle border)
        React.createElement('circle', {
          cx: knobX,
          cy: knobY,
          r: knobR,
          fill: '#FFFFFF',
          stroke: colors.background,
          strokeWidth: 2,
        })
      );
    }

    return (
      <View style={{ width: gaugeDiameter, height: gaugeRadius + strokeWidth, position: 'relative' }}>
        <View
          style={{
            width: gaugeDiameter,
            height: gaugeRadius,
            borderTopLeftRadius: gaugeRadius,
            borderTopRightRadius: gaugeRadius,
            borderWidth: strokeWidth,
            borderBottomWidth: 0,
            borderColor: 'rgba(255, 255, 255, 0.12)',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
        <View
          style={{
            width: gaugeDiameter,
            height: gaugeRadius,
            borderTopLeftRadius: gaugeRadius,
            borderTopRightRadius: gaugeRadius,
            borderWidth: strokeWidth,
            borderBottomWidth: 0,
            borderColor: colors.primary,
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0.95,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: knobX - knobR,
            top: knobY - knobR,
            width: knobR * 2,
            height: knobR * 2,
            borderRadius: knobR,
            backgroundColor: colors.secondary,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            elevation: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
          }}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Account Type Selector Pills */}
      <View style={styles.pillRow}>
        <TouchableOpacity
          style={[styles.pillBtn, currentAccount === 'salary' && styles.pillBtnActive]}
          onPress={() => onSelectAccount('salary')}
          activeOpacity={0.8}
        >
          <Text style={[styles.pillText, currentAccount === 'salary' && styles.pillTextActive]}>
            Salary
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillBtn, currentAccount === 'cash' && styles.pillBtnActive]}
          onPress={() => onSelectAccount('cash')}
          activeOpacity={0.8}
        >
          <Text style={[styles.pillText, currentAccount === 'cash' && styles.pillTextActive]}>
            Cash
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillBtn, currentAccount === 'savings' && styles.pillBtnActive]}
          onPress={() => onSelectAccount('savings')}
          activeOpacity={0.8}
        >
          <Text style={[styles.pillText, currentAccount === 'savings' && styles.pillTextActive]}>
            Savings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Frosted Glass Account Card: Midnight Navy + Rich Slate */}
      <View style={styles.glassCard}>
        <View style={styles.cardHeader}>
          <Text style={[styles.accountTitle, { fontSize: Math.round(18 * scale) }]}>
            {accountData.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: currentAccount === 'salary' ? 'rgba(0, 229, 168, 0.16)' : accountData.badgeBg, borderColor: currentAccount === 'salary' ? 'rgba(0, 229, 168, 0.35)' : 'rgba(255, 255, 255, 0.12)' }]}>
            <Text style={[styles.badgeText, { color: currentAccount === 'salary' ? colors.primary : accountData.badgeColor }]}>
              {accountData.badge}
            </Text>
          </View>
        </View>

        {/* Meter Gauge */}
        <View style={[styles.gaugeContainer, { height: gaugeRadius + 30 }]}>
          {renderArc()}
          <View style={styles.gaugeCenterContent}>
            <Text style={[styles.gaugeLabel, { color: colors.primary, fontSize: Math.round(12 * scale) }]}>
              {accountData.centerLabel}
            </Text>
            <Text style={[styles.gaugeAmount, { fontSize: Math.round(33 * scale) }]}>
              {accountData.amount}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { fontSize: Math.round(11 * scale) }]}>
              {accountData.stat1Label}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={[
                  styles.statValue,
                  { fontSize: Math.round(16 * scale) },
                  accountData.stat1IsPositive ? { color: colors.emerald } : { color: colors.coral },
                ]}
              >
                {accountData.stat1Value}
              </Text>
              {accountData.stat1IsPositive ? (
                <IconTrendUp size={14} color={colors.emerald} />
              ) : (
                <IconTrendDown size={14} color={colors.coral} />
              )}
            </View>
          </View>

          <View style={[styles.statCol, { alignItems: 'flex-end' }]}>
            <Text style={[styles.statLabel, { fontSize: Math.round(11 * scale) }]}>
              {accountData.stat2Label}
            </Text>
            <Text style={[styles.statValue, { fontSize: Math.round(16 * scale) }]}>
              {accountData.stat2Value}
            </Text>
          </View>
        </View>
      </View>

      {/* Pagination dots */}
      <View style={styles.paginationDots}>
        <TouchableOpacity
          style={[styles.dot, currentAccount === 'salary' ? styles.dotActive : styles.dotInactive]}
          onPress={() => onSelectAccount('salary')}
        />
        <TouchableOpacity
          style={[styles.dot, currentAccount === 'cash' ? styles.dotActive : styles.dotInactive]}
          onPress={() => onSelectAccount('cash')}
        />
        <TouchableOpacity
          style={[styles.dot, currentAccount === 'savings' ? styles.dotActive : styles.dotInactive]}
          onPress={() => onSelectAccount('savings')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22, 31, 50, 0.8)',
    borderRadius: 24,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillBtn: {
    paddingVertical: 7,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  pillBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  pillText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  pillTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  glassCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 14,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  gaugeContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 6,
  },
  gaugeCenterContent: {
    position: 'absolute',
    bottom: 2,
    alignItems: 'center',
  },
  gaugeLabel: {
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  gaugeAmount: {
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statCol: {
    gap: 3,
  },
  statLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
