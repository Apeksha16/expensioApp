import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { IconAnalytics, IconTrendDown } from '../components/icons/Icons';
import { colors } from '../theme/colors';

export interface DaySpend {
  day: string;
  short: string;
  amount: number;
}

interface SpendingChartWidgetProps {
  data?: DaySpend[];
  totalWeekly?: string;
  scale?: number;
}

const DEFAULT_DATA: DaySpend[] = [
  { day: 'Monday', short: 'M', amount: 45 },
  { day: 'Tuesday', short: 'T', amount: 80 },
  { day: 'Wednesday', short: 'W', amount: 201 },
  { day: 'Thursday', short: 'T', amount: 55 },
  { day: 'Friday', short: 'F', amount: 35 },
  { day: 'Saturday', short: 'S', amount: 30 },
  { day: 'Sunday', short: 'S', amount: 12 },
];

export function SpendingChartWidget({
  data = DEFAULT_DATA,
  totalWeekly = '₹458',
  scale = 1,
}: SpendingChartWidgetProps) {
  const [selectedDay, setSelectedDay] = useState<number>(2); // Wednesday by default

  const maxAmount = Math.max(...data.map((d) => d.amount), 100);
  const activeItem = data[selectedDay] || data[2];

  return (
    <View style={styles.container}>
      <View style={styles.glassCard}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>7-DAY SPENDING TREND</Text>
            <Text style={[styles.title, { fontSize: Math.round(22 * scale) }]}>
              {totalWeekly}
            </Text>
          </View>

          <View style={styles.tag}>
            <IconTrendDown size={14} color={colors.emerald} />
            <Text style={styles.tagText}>-14% vs last week</Text>
          </View>
        </View>

        {/* Selected Day Info Pill */}
        <View style={styles.selectedPill}>
          <Text style={styles.selectedPillText}>
            {activeItem.day}: <Text style={{ color: colors.primary, fontWeight: '800' }}>₹{activeItem.amount}</Text>
          </Text>
        </View>

        {/* Bar Chart Area */}
        <View style={styles.chartArea}>
          {data.map((item, index) => {
            const isSelected = index === selectedDay;
            const heightPercent = Math.max(Math.round((item.amount / maxAmount) * 100), 12);

            return (
              <TouchableOpacity
                key={index}
                style={styles.barCol}
                activeOpacity={0.8}
                onPress={() => setSelectedDay(index)}
              >
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${heightPercent}%` },
                      isSelected ? styles.barFillActive : styles.barFillInactive,
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.dayText,
                    isSelected ? styles.dayTextActive : styles.dayTextInactive,
                  ]}
                >
                  {item.short}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
    padding: 18,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.emeraldMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  tagText: {
    color: colors.emerald,
    fontSize: 11,
    fontWeight: '700',
  },
  selectedPill: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedPillText: {
    color: colors.textPrimary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 105,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barTrack: {
    width: 22,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barFillActive: {
    backgroundColor: colors.primary,
  },
  barFillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dayText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  dayTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayTextInactive: {
    color: colors.textMuted,
  },
});
