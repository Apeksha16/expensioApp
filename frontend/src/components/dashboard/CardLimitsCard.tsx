import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '../../services/haptics';

interface CardLimitsCardProps {
  todaySpent?: number;
  totalLimit?: number;
  currencySymbol?: string;
  onPressSetLimits?: () => void;
}

export const CardLimitsCard: React.FC<CardLimitsCardProps> = ({
  todaySpent = 650.49,
  totalLimit = 43865.0,
  currencySymbol = '$',
  onPressSetLimits,
}) => {
  const percentage = Math.min(100, Math.max(0, (todaySpent / totalLimit) * 100));

  const formattedSpent = `${currencySymbol}${todaySpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedLimit = `${currencySymbol}${totalLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Card Limits</Text>

      {/* Styled Segmented Track */}
      <View style={styles.trackContainer}>
        {/* Striped / Segmented Background Pattern */}
        <View style={styles.segmentedBackground}>
          {Array.from({ length: 26 }).map((_, index) => (
            <View key={index} style={styles.trackSegmentTick} />
          ))}
        </View>

        {/* Active Fill Gradient Bar */}
        <View style={[styles.activeFill, { width: `${Math.max(14, percentage)}%` }]}>
          <LinearGradient
            colors={['#0284C7', '#38BDF8']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          {/* Thumb marker */}
          <View style={styles.thumbHandle} />
        </View>
      </View>

      {/* Labels row: Today Limits vs Amount */}
      <View style={styles.limitsRow}>
        <Text style={styles.todayLimitLabel}>Today Limits</Text>
        <Text style={styles.limitsValue}>
          <Text style={styles.spentHighlight}>{formattedSpent}</Text>
          <Text style={styles.totalLimitMuted}> / {formattedLimit}</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Action link: Set card limits -> */}
      <TouchableOpacity
        style={styles.setLimitsRow}
        onPress={() => {
          try { haptics.selection(); } catch {}
          onPressSetLimits?.();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.setLimitsText}>Set card limits</Text>
        <Feather name="arrow-right" size={15} color="#0F172A" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  trackContainer: {
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentedBackground: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    alignItems: 'center',
    width: '100%',
  },
  trackSegmentTick: {
    width: 2,
    height: 8,
    backgroundColor: '#CBD5E1',
    borderRadius: 1,
  },
  activeFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 9,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  thumbHandle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginRight: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  limitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  todayLimitLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  limitsValue: {
    fontSize: 12,
  },
  spentHighlight: {
    fontWeight: '800',
    color: '#0F172A',
  },
  totalLimitMuted: {
    fontWeight: '600',
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  setLimitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setLimitsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
});
