import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { moduleRegistryService } from '../services/moduleRegistryService';
import { colors, radius, shadows, spacing, typography } from '../theme';

export function BottomNavigation({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { preferredModuleIds } = useApp();
  const tabs = preferredModuleIds
    .map((id) => moduleRegistryService.getModuleById(id))
    .filter((module): module is NonNullable<typeof module> => Boolean(
      module?.available
      && module.navigationVisible
      && state.routes.some((route) => route.name === module.route),
    ));
  const hasAdditionalModulesTab = tabs.some((module) => module.id === 'additional-modules');
  const selectedRoutes = new Set<string>(tabs.map((module) => module.route));
  const currentRouteName = state.routes[state.index]?.name;
  const historyRouteNames = state.history
    .slice()
    .reverse()
    .map((entry) => state.routes.find((route) => route.key === entry.key)?.name);
  const activeRouteName = currentRouteName && selectedRoutes.has(currentRouteName)
    ? currentRouteName
    : currentRouteName === 'Profile' || currentRouteName === 'EmailChange'
      ? historyRouteNames.find((name) => name && selectedRoutes.has(name))
      : undefined;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {!hasAdditionalModulesTab ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open all modules"
          onPress={() => navigation.navigate('AdditionalModules' as never)}
          style={({ pressed }) => [styles.moreAccess, pressed && styles.pressed]}
        >
          <Ionicons name="grid-outline" size={15} color={colors.accent} />
          <Text style={styles.moreAccessText}>All modules</Text>
        </Pressable>
      ) : null}
      <View style={styles.bar}>
        {tabs.map((module) => {
          const route = state.routes.find((item) => item.name === module.route);
          if (!route) return null;
          const focused = activeRouteName === route.name;
          return (
            <Pressable
              key={module.id}
              accessibilityRole="button"
              accessibilityLabel={module.name}
              accessibilityState={{ selected: focused }}
              onPress={() => navigation.navigate(route.name as never)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons
                  name={(focused ? module.activeIcon : module.icon) as keyof typeof Ionicons.glyphMap}
                  size={21}
                  color={focused ? colors.accent : colors.textTertiary}
                />
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, focused && styles.labelActive]}>
                {module.navLabel}
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
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  moreAccess: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    paddingHorizontal: spacing.sm,
  },
  moreAccessText: {
    ...typography.micro,
    color: colors.accent,
    fontWeight: '700',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    ...shadows.card,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 2,
  },
  iconWrap: {
    width: 38,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  iconWrapActive: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  label: {
    ...typography.micro,
    fontSize: 9,
    color: colors.textTertiary,
    maxWidth: '100%',
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
