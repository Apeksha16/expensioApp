import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppModule } from '../../data/modules';
import { moduleRegistryService } from '../../services/moduleRegistryService';
import { useApp } from '../../context/AppContext';
import type { MainTabParamList } from '../../navigation/MainTabs';
import { colors, radius, spacing, typography } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList>;

export function ModuleLandingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { preferredModuleIds } = useApp();
  const currentModule = moduleRegistryService.getModuleByRoute(route.name);
  const isAdditionalModules = currentModule?.id === 'additional-modules';
  const modules = moduleRegistryService.getModules();
  const additionalModules = modules.filter(
    (module) => module.available
      && module.navigationVisible
      && !preferredModuleIds.includes(module.id)
      && module.id !== 'additional-modules',
  );

  const openModule = (module: AppModule) => {
    if (module.route === 'Add') {
      navigation.navigate('Add', { type: 'expense' });
      return;
    }
    navigation.navigate(module.route);
  };

  if (!currentModule) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.title}>Module unavailable</Text>
        <Text style={styles.copy}>This destination is not available on this version.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: colors.accentSoft }]}>
            <Ionicons
              name={currentModule.icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={colors.accent}
            />
          </View>
          <Text style={styles.title}>{currentModule.name}</Text>
          <Text style={styles.copy}>{currentModule.description}.</Text>
        </View>

        {isAdditionalModules ? (
          <>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Available outside your navbar</Text>
              <Text style={styles.sectionSub}>Your five preferred modules stay in the bottom bar.</Text>
            </View>
            {additionalModules.map((module) => (
              <Pressable
                key={module.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${module.name}`}
                onPress={() => openModule(module)}
                style={({ pressed }) => [styles.moduleRow, pressed && styles.pressed]}
              >
                <View style={styles.moduleIcon}>
                  <Ionicons name={module.icon as keyof typeof Ionicons.glyphMap} size={21} color={colors.accent} />
                </View>
                <View style={styles.moduleCopy}>
                  <Text style={styles.moduleTitle}>{module.name}</Text>
                  <Text style={styles.moduleDescription}>{module.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Profile settings"
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [styles.moduleRow, pressed && styles.pressed]}
            >
              <View style={styles.moduleIcon}>
                <Ionicons name="person-outline" size={21} color={colors.accent} />
              </View>
              <View style={styles.moduleCopy}>
                <Text style={styles.moduleTitle}>Profile & settings</Text>
                <Text style={styles.moduleDescription}>Personal information and preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
            {!additionalModules.length ? (
              <View style={styles.empty}>
                <Text style={styles.moduleTitle}>All modules are in your navbar</Text>
                <Text style={styles.moduleDescription}>You can change your five choices in Profile.</Text>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Profile')}
              style={styles.manageButton}
            >
              <Ionicons name="options-outline" size={18} color={colors.accent} />
              <Text style={styles.manageButtonText}>Manage preferred modules</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles-outline" size={22} color={colors.accent} />
            </View>
            <Text style={styles.moduleTitle}>Nothing here yet</Text>
            <Text style={styles.moduleDescription}>
              Your information will appear here as you add it. No sample financial data is shown.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 150, gap: spacing.md },
  centered: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  headerIcon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  title: { ...typography.h1, color: colors.textPrimary },
  copy: { ...typography.body, color: colors.textSecondary, lineHeight: 23 },
  sectionHeading: { gap: 4, marginTop: spacing.sm, marginBottom: spacing.xs },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  sectionSub: { ...typography.caption, color: colors.textSecondary, lineHeight: 19 },
  moduleRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  moduleIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  moduleCopy: { flex: 1, gap: 3 },
  moduleTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  moduleDescription: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  empty: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.accentSoft },
  manageButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.accentMuted, backgroundColor: colors.accentSoft },
  manageButtonText: { ...typography.bodySemibold, color: colors.accentDark },
  pressed: { opacity: 0.8 },
});
