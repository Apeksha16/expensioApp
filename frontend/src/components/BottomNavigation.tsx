import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, typography } from '../theme';

const tabs: {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: 'Home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  {
    name: 'Activity',
    label: 'Activity',
    icon: 'time-outline',
    iconActive: 'time',
  },
  { name: 'Add', label: 'Add', icon: 'add', iconActive: 'add' },
  {
    name: 'Split',
    label: 'Split',
    icon: 'people-outline',
    iconActive: 'people',
  },
  {
    name: 'Profile',
    label: 'Profile',
    icon: 'person-outline',
    iconActive: 'person',
  },
];

export function BottomNavigation({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {tabs.map((tab, index) => {
          const focused = state.index === index;
          const isAdd = tab.name === 'Add';

          if (isAdd) {
            return (
              <Pressable
                key={tab.name}
                onPress={() => navigation.navigate(tab.name)}
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add" size={28} color={colors.white} />
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.name}
              onPress={() => navigation.navigate(tab.name)}
              style={styles.tab}
            >
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={22}
                color={focused ? colors.accent : colors.textTertiary}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.micro,
    color: colors.textTertiary,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    ...shadows.button,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
});
