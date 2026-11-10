import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { colors, radius, spacing, typography } from '../../theme';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, logout } = useApp();
  const name = profile?.name.trim() || 'Your profile';
  const userId = profile?.userId || '@new-user';

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>YOUR SPACE</Text>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{name[0].toUpperCase()}</Text></View>
          <View style={styles.profileCopy}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.userId}>{userId}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
        <Text style={styles.sectionTitle}>Your account</Text>
        <View style={styles.menu}>
          <MenuRow icon="wallet-outline" label="Income & balances" value="Manage" />
          <MenuRow icon="shield-checkmark-outline" label="Privacy & security" value="Protected" />
          <MenuRow icon="help-circle-outline" label="Help centre" value="Talk to us" />
        </View>
        <Pressable onPress={logout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.expense} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MenuRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <Pressable style={styles.menuRow}>
      <View style={styles.menuIcon}><Ionicons name={icon} size={20} color={colors.accent} /></View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  scroll: { paddingBottom: 160 },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 1.4 },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xs },
  profileCard: {
    marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center',
  },
  avatar: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.surprise, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800', color: colors.accentDark },
  profileCopy: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.h3, color: colors.textPrimary },
  userId: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.xxl, marginBottom: spacing.sm },
  menu: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  menuRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  menuIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
  menuValue: { ...typography.caption, color: colors.textTertiary },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  logoutText: { ...typography.bodySemibold, color: colors.expense },
});
