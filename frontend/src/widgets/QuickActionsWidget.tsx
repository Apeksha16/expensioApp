import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import {
  IconScan,
  IconSend,
  IconSplit,
  IconPlus,
  IconAnalytics,
} from '../components/icons/Icons';
import { colors } from '../theme/colors';

interface QuickActionsWidgetProps {
  onScan?: () => void;
  onSend?: () => void;
  onSplit?: () => void;
  onAddExpense?: () => void;
  onAnalytics?: () => void;
}

export function QuickActionsWidget({
  onScan,
  onSend,
  onSplit,
  onAddExpense,
  onAnalytics,
}: QuickActionsWidgetProps) {
  const actions = [
    {
      id: 'scan',
      title: 'Scan QR',
      renderIcon: () => <IconScan size={20} color={colors.primary} />,
      onPress: onScan,
    },
    {
      id: 'send',
      title: 'Send',
      renderIcon: () => <IconSend size={20} color={colors.textPrimary} />,
      onPress: onSend,
    },
    {
      id: 'split',
      title: 'Split Bill',
      renderIcon: () => <IconSplit size={20} color={colors.textPrimary} />,
      badge: 'GGN',
      onPress: onSplit,
    },
    {
      id: 'add',
      title: 'Add',
      renderIcon: () => <IconPlus size={20} color={colors.textPrimary} />,
      onPress: onAddExpense,
    },
    {
      id: 'analytics',
      title: 'Reports',
      renderIcon: () => <IconAnalytics size={20} color={colors.textPrimary} />,
      onPress: onAnalytics,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.glassContainer}>
        {actions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={item.onPress}
          >
            <View style={styles.iconBubble}>
              {item.renderIcon()}
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.actionLabel} numberOfLines={1}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  glassContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
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
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    color: colors.textDark,
    fontSize: 9,
    fontWeight: '800',
  },
  actionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
