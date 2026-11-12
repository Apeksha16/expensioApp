import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { profileAvatars, getProfileAvatar } from '../../data/avatars';
import { type AppModuleId, PREFERRED_MODULE_LIMIT } from '../../data/modules';
import { moduleRegistryService } from '../../services/moduleRegistryService';
import type { MainTabParamList } from '../../navigation/MainTabs';
import type { ReportDayOfWeek, ReportFrequency } from '../../core/storage/preferences';
import { formatLocalReportDate, getNextReportDates } from '../../services/reportScheduleService';
import type { ReportPreferenceChanges } from '../../services/reportPreferenceService';
import { colors, radius, spacing, typography } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;
const reportOptions: { value: ReportFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'twice-monthly', label: 'Twice a month' },
  { value: 'monthly', label: 'Monthly' },
];
const weekdays: { value: ReportDayOfWeek; label: string; short: string }[] = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    profileState,
    showToast,
    saveAvatarPreference,
    saveReportPreferences,
    savePreferredModules,
    logout,
  } = useApp();
  const {
    firstName: savedFirstName,
    lastName: savedLastName,
    mobile,
    countryCode,
    email: savedEmail,
    preferredModuleIds,
    avatarId,
    reportFrequency,
    reportsEnabled,
    reportDayOfWeek,
    reportDayOfMonth,
    reportEmail,
  } = profileState;
  const [draftModules, setDraftModules] = useState<AppModuleId[]>(preferredModuleIds);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [draftAvatarId, setDraftAvatarId] = useState(avatarId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reportSaving, setReportSaving] = useState(false);
  const [reportDraft, setReportDraft] = useState<ReportPreferenceChanges>({
    reportFrequency,
    reportsEnabled,
    reportDayOfWeek,
    reportDayOfMonth,
    reportEmail,
  });

  useEffect(() => {
    setDraftModules(preferredModuleIds);
  }, [preferredModuleIds]);
  useEffect(() => {
    setDraftAvatarId(avatarId);
  }, [avatarId]);
  useEffect(() => {
    setReportDraft({ reportFrequency, reportsEnabled, reportDayOfWeek, reportDayOfMonth, reportEmail });
  }, [reportFrequency, reportsEnabled, reportDayOfWeek, reportDayOfMonth, reportEmail]);

  const fullName = [savedFirstName, savedLastName].filter(Boolean).join(' ').trim()
    || 'Name not added';
  const firstName = savedFirstName || 'Not added yet';
  const lastName = savedLastName || 'Not added yet';
  const email = savedEmail || 'Email not added';
  const mobileLabel = mobile
    ? `${countryCode || '+91'} ${mobile.length > 4 ? `••••••${mobile.slice(-4)}` : mobile}`
    : 'Mobile number not added';
  const reportDestinationEmail = reportDraft.reportEmail || (email === 'Email not added' ? '' : email);
  const avatar = getProfileAvatar(draftAvatarId);
  const hasPreferenceChanges = draftModules.join('|') !== preferredModuleIds.join('|');
  const hasReportChanges = reportDraft.reportFrequency !== reportFrequency
    || reportDraft.reportsEnabled !== reportsEnabled
    || reportDraft.reportDayOfWeek !== reportDayOfWeek
    || reportDraft.reportDayOfMonth !== reportDayOfMonth
    || reportDestinationEmail !== reportEmail;
  const upcomingReportDates = getNextReportDates({
    frequency: reportDraft.reportFrequency,
    dayOfWeek: reportDraft.reportDayOfWeek,
    dayOfMonth: reportDraft.reportDayOfMonth,
  });

  const orderedModules = useMemo(
    () => moduleRegistryService.getModules(),
    [],
  );

  const toggleModule = (id: AppModuleId) => {
    setError('');
    setMessage('');
    if (!draftModules.includes(id) && draftModules.length >= PREFERRED_MODULE_LIMIT) {
      const notice = `Choose up to ${PREFERRED_MODULE_LIMIT} preferred modules. Remove one before adding another.`;
      setError(notice);
      showToast('error', notice);
      return;
    }
    setDraftModules((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id]);
  };

  const moveModule = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draftModules.length) return;
    setDraftModules((current) => {
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    setError('');
    setMessage('');
  };

  const saveModulePreferences = async () => {
    if (saving) return;
    if (draftModules.length !== PREFERRED_MODULE_LIMIT) {
      const notice = `Select exactly ${PREFERRED_MODULE_LIMIT} modules.`;
      setError(notice);
      showToast('error', notice);
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await savePreferredModules(draftModules);
      setMessage('Preferred modules saved.');
      showToast('success', 'Preferred modules saved.');
    } catch (saveError) {
      const notice = saveError instanceof Error ? saveError.message : 'Unable to save module preferences on this device.';
      setError(notice);
      showToast('error', notice);
    } finally {
      setSaving(false);
    }
  };

  const saveAvatar = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await saveAvatarPreference(draftAvatarId);
      setAvatarPickerOpen(false);
      setMessage('Avatar saved.');
      showToast('success', 'Avatar updated.');
    } catch (saveError) {
      const notice = saveError instanceof Error ? saveError.message : 'Unable to save avatar on this device.';
      setError(notice);
      showToast('error', notice);
    } finally {
      setSaving(false);
    }
  };

  const saveReportSettings = async () => {
    if (reportSaving || !hasReportChanges) return;
    setReportSaving(true);
    setError('');
    setMessage('');
    try {
      await saveReportPreferences({ ...reportDraft, reportEmail: reportDestinationEmail });
      const successMessage = reportDraft.reportsEnabled !== reportsEnabled
        ? `Automatic reports ${reportDraft.reportsEnabled ? 'enabled' : 'disabled'}.`
        : reportDraft.reportFrequency !== reportFrequency
          ? 'Report frequency updated.'
          : 'Report preferences saved on this device.';
      setMessage(successMessage);
      showToast('success', successMessage);
    } catch (saveError) {
      const notice = saveError instanceof Error ? saveError.message : 'Unable to save report preferences.';
      setError(notice);
      showToast('error', notice);
    } finally {
      setReportSaving(false);
    }
  };

  const openAvatarPicker = () => {
    setDraftAvatarId(avatarId);
    setAvatarPickerOpen(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>YOUR SPACE</Text>
        <Text style={styles.pageTitle}>Profile</Text>

        <View style={styles.identityCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change cartoon avatar"
            onPress={openAvatarPicker}
            style={styles.avatarButton}
          >
            <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
            <View style={styles.editAvatarBadge}>
              <Ionicons name="pencil" size={12} color={colors.white} />
            </View>
          </Pressable>
          <View style={styles.identityCopy}>
            <Text style={styles.identityEyebrow}>YOUR EXPENSIO PROFILE</Text>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.userId}>{mobileLabel}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change avatar"
            onPress={openAvatarPicker}
            style={styles.changeAvatarButton}
          >
            <Text style={styles.changeAvatarText}>Change</Text>
          </Pressable>
        </View>

        <SectionHeading title="Personal information" subtitle="Your name and verified number stay read-only." />
        <View style={styles.infoCard}>
          <InfoRow icon="person-outline" label="First name" value={firstName} />
          <InfoRow icon="person-outline" label="Last name" value={lastName} />
          <InfoRow icon="call-outline" label="Mobile number" value={mobileLabel} />
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Ionicons name="mail-outline" size={19} color={colors.accent} /></View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
              <Text numberOfLines={1} style={styles.infoValue}>{email}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('EmailChange')}
              style={styles.editEmailButton}
            >
              <Text style={styles.editEmailText}>Edit</Text>
            </Pressable>
          </View>
        </View>

        <SectionHeading title="Preferred modules" subtitle={`Choose and order exactly ${PREFERRED_MODULE_LIMIT} navbar destinations.`} />
        <View style={styles.preferenceCard}>
          <View style={styles.selectedHeading}>
            <Text style={styles.selectedTitle}>Current selection order</Text>
            <Text style={styles.selectionCount}>{draftModules.length}/{PREFERRED_MODULE_LIMIT}</Text>
          </View>
          <View style={styles.selectedList}>
            {draftModules.map((id, index) => {
              const module = moduleRegistryService.getModuleById(id);
              if (!module) return null;
              return (
                <View key={module.id} style={styles.selectedRow}>
                  <View style={styles.orderBadge}><Text style={styles.orderText}>{index + 1}</Text></View>
                  <Ionicons name={module.icon as keyof typeof Ionicons.glyphMap} size={19} color={colors.accent} />
                  <Text style={styles.selectedModuleName}>{module.name}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${module.name} up`}
                    accessibilityState={{ disabled: index === 0 }}
                    disabled={index === 0}
                    onPress={() => moveModule(index, -1)}
                    style={[styles.reorderButton, index === 0 && styles.reorderDisabled]}
                  >
                    <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${module.name} down`}
                    accessibilityState={{ disabled: index === draftModules.length - 1 }}
                    disabled={index === draftModules.length - 1}
                    onPress={() => moveModule(index, 1)}
                    style={[styles.reorderButton, index === draftModules.length - 1 && styles.reorderDisabled]}
                  >
                    <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>
              );
            })}
          </View>
          <Text style={styles.availableHeading}>Choose from all available modules</Text>
          <View style={styles.moduleGrid}>
            {orderedModules.map((module) => {
              const selectedIndex = draftModules.indexOf(module.id);
              const selected = selectedIndex >= 0;
              return (
                <Pressable
                  key={module.id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${module.name}${selected ? `, selected at position ${selectedIndex + 1}` : ', not selected'}`}
                  accessibilityState={{ checked: selected, disabled: !module.available || (!selected && draftModules.length >= PREFERRED_MODULE_LIMIT) }}
                  disabled={!module.available || (!selected && draftModules.length >= PREFERRED_MODULE_LIMIT)}
                  onPress={() => toggleModule(module.id)}
                  style={[
                    styles.moduleOption,
                    selected && styles.moduleOptionSelected,
                    !module.available && styles.moduleOptionDisabled,
                  ]}
                >
                  <View style={styles.moduleOptionIcon}>
                    <Ionicons name={module.icon as keyof typeof Ionicons.glyphMap} size={18} color={selected ? colors.accent : colors.textSecondary} />
                  </View>
                  <Text numberOfLines={1} style={[styles.moduleOptionName, selected && styles.moduleOptionNameSelected]}>{module.name}</Text>
                  {selected ? <Text style={styles.moduleOrder}>{selectedIndex + 1}</Text> : null}
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.preferenceHint}>
            Remove a selected module, then choose another to replace it. Dashboard remains the app's starting screen.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasPreferenceChanges || draftModules.length !== PREFERRED_MODULE_LIMIT || saving }}
            disabled={!hasPreferenceChanges || draftModules.length !== PREFERRED_MODULE_LIMIT || saving}
            onPress={() => void saveModulePreferences()}
            style={[styles.saveButton, (!hasPreferenceChanges || draftModules.length !== PREFERRED_MODULE_LIMIT || saving) && styles.saveButtonDisabled]}
          >
            <Text style={[styles.saveButtonText, (!hasPreferenceChanges || draftModules.length !== PREFERRED_MODULE_LIMIT || saving) && styles.saveButtonTextDisabled]}>
              {saving ? 'Saving…' : 'Save module preferences'}
            </Text>
          </Pressable>
        </View>

        <SectionHeading title="Report frequency" subtitle="Set a local preview preference. No reports or emails are sent." />
        <View style={styles.reportCard}>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Automatic reports"
            accessibilityState={{ checked: reportDraft.reportsEnabled }}
            onPress={() => setReportDraft((current) => ({ ...current, reportsEnabled: !current.reportsEnabled }))}
            style={styles.reportToggle}
          >
            <View style={styles.reportToggleCopy}>
              <Text style={styles.reportToggleTitle}>Automatic reports</Text>
              <Text style={styles.reportToggleSubtitle}>{reportDraft.reportsEnabled ? 'Enabled' : 'Disabled'}</Text>
            </View>
            <View style={[styles.toggleTrack, reportDraft.reportsEnabled && styles.toggleTrackActive]}>
              <View style={[styles.toggleThumb, reportDraft.reportsEnabled && styles.toggleThumbActive]} />
            </View>
          </Pressable>

          <View style={styles.reportDivider} />
          <Text style={styles.reportLabel}>FREQUENCY</Text>
          <View style={styles.frequencyCard}>
            {reportOptions.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: reportDraft.reportFrequency === option.value }}
                onPress={() => setReportDraft((current) => ({ ...current, reportFrequency: option.value }))}
                style={[styles.frequencyOption, reportDraft.reportFrequency === option.value && styles.frequencyOptionActive]}
              >
                <Text numberOfLines={2} style={[styles.frequencyText, reportDraft.reportFrequency === option.value && styles.frequencyTextActive]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>

          {reportDraft.reportFrequency === 'weekly' ? (
            <View style={styles.scheduleGroup}>
              <Text style={styles.reportLabel}>DELIVERY DAY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayOptions}>
                {weekdays.map((day) => (
                  <Pressable
                    key={day.value}
                    accessibilityRole="radio"
                    accessibilityLabel={day.label}
                    accessibilityState={{ selected: reportDraft.reportDayOfWeek === day.value }}
                    onPress={() => setReportDraft((current) => ({ ...current, reportDayOfWeek: day.value }))}
                    style={[styles.dayOption, reportDraft.reportDayOfWeek === day.value && styles.dayOptionActive]}
                  >
                    <Text style={[styles.dayOptionText, reportDraft.reportDayOfWeek === day.value && styles.dayOptionTextActive]}>{day.short}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {reportDraft.reportFrequency === 'twice-monthly' ? (
            <View style={styles.scheduleGroup}>
              <Text style={styles.reportLabel}>DELIVERY DATES</Text>
              <View style={styles.fixedDates}>
                <Text style={styles.fixedDate}>1st of each month</Text>
                <Text style={styles.fixedDate}>15th of each month</Text>
              </View>
            </View>
          ) : null}

          {reportDraft.reportFrequency === 'monthly' ? (
            <View style={styles.scheduleGroup}>
              <Text style={styles.reportLabel}>DELIVERY DATE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthDayOptions}>
                {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                  <Pressable
                    key={day}
                    accessibilityRole="radio"
                    accessibilityLabel={`Day ${day} of the month`}
                    accessibilityState={{ selected: reportDraft.reportDayOfMonth === day }}
                    onPress={() => setReportDraft((current) => ({ ...current, reportDayOfMonth: day }))}
                    style={[styles.monthDayOption, reportDraft.reportDayOfMonth === day && styles.dayOptionActive]}
                  >
                    <Text style={[styles.monthDayText, reportDraft.reportDayOfMonth === day && styles.dayOptionTextActive]}>{day}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.reportHint}>If a date is not available in a month, the preview uses that month's last day.</Text>
            </View>
          ) : null}

          <View style={styles.reportDestination}>
            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
            <View style={styles.reportDestinationCopy}>
              <Text style={styles.reportLabel}>REPORT DESTINATION</Text>
              <Text numberOfLines={1} style={styles.reportDestinationEmail}>{reportDestinationEmail || 'Email not added'}</Text>
            </View>
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>NEXT EXPECTED {upcomingReportDates.length > 1 ? 'DATES' : 'DATE'}</Text>
            {reportDraft.reportsEnabled
              ? upcomingReportDates.map((date) => (
                <Text key={date.toISOString()} style={styles.previewDate}>{formatLocalReportDate(date)}</Text>
              ))
              : <Text style={styles.reportHint}>Turn on automatic reports to see a schedule preview.</Text>}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasReportChanges || reportSaving }}
            disabled={!hasReportChanges || reportSaving}
            onPress={() => void saveReportSettings()}
            style={[styles.saveButton, (!hasReportChanges || reportSaving) && styles.saveButtonDisabled]}
          >
            <Text style={[styles.saveButtonText, (!hasReportChanges || reportSaving) && styles.saveButtonTextDisabled]}>
              {reportSaving ? 'Saving…' : 'Save report preferences'}
            </Text>
          </Pressable>
        </View>

        {message ? <Text accessibilityRole="alert" style={styles.successMessage}>{message}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.errorMessage}>{error}</Text> : null}

        <SectionHeading title="Account" subtitle="Your data and settings stay on this device." />
        <Pressable onPress={() => void logout()} style={styles.logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.expense} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={avatarPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAvatarPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.avatarModal, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choose your avatar</Text>
                <Text style={styles.modalSubtitle}>Pick a cartoon friend for your profile.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close avatar picker" onPress={() => setAvatarPickerOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={21} color={colors.textPrimary} />
              </Pressable>
            </View>
            <View style={[styles.avatarPreview, { backgroundColor: getProfileAvatar(draftAvatarId).backgroundColor }]}>
              <Text style={styles.avatarPreviewEmoji}>{getProfileAvatar(draftAvatarId).emoji}</Text>
            </View>
            <View style={styles.avatarGrid}>
              {profileAvatars.map((item) => {
                const selected = draftAvatarId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="radio"
                    accessibilityLabel={`Select ${item.id} avatar`}
                    accessibilityState={{ selected }}
                    onPress={() => setDraftAvatarId(item.id)}
                    style={[styles.avatarChoice, { backgroundColor: item.backgroundColor }, selected && styles.avatarChoiceSelected]}
                  >
                    <Text style={styles.avatarChoiceEmoji}>{item.emoji}</Text>
                    {selected ? <View style={styles.avatarChoiceCheck}><Ionicons name="checkmark" size={13} color={colors.white} /></View> : null}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <Pressable accessibilityRole="button" onPress={() => { setDraftAvatarId(avatarId); setAvatarPickerOpen(false); }} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={saving} onPress={() => void saveAvatar()} style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
                <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save avatar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={19} color={colors.accent} /></View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
        <Text numberOfLines={1} style={styles.infoValue}>{value}</Text>
      </View>
      <Ionicons name="lock-closed-outline" size={15} color={colors.textTertiary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  scroll: { paddingBottom: 150, gap: spacing.sm },
  kicker: { ...typography.label, color: colors.accent, letterSpacing: 1.4 },
  pageTitle: { ...typography.h1, color: colors.textPrimary, marginTop: -spacing.xs },
  identityCard: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.accentDark, borderWidth: 1, borderColor: colors.accentDark, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarButton: { width: 62, height: 62, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surprise, borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)' },
  avatarEmoji: { fontSize: 38 },
  editAvatarBadge: { position: 'absolute', right: -3, bottom: -3, width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.accentDark },
  identityCopy: { flex: 1, minWidth: 0 },
  identityEyebrow: { ...typography.micro, color: colors.surprise, letterSpacing: 0.7, marginBottom: 2 },
  name: { ...typography.h3, color: colors.white },
  userId: { ...typography.caption, color: 'rgba(255,255,255,0.72)', marginTop: 3 },
  changeAvatarButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.12)' },
  changeAvatarText: { ...typography.captionMedium, color: colors.white },
  sectionHeading: { gap: 3, marginTop: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  sectionSubtitle: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  infoCard: { paddingHorizontal: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  infoRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  infoIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1, minWidth: 0, gap: 3 },
  infoLabel: { ...typography.micro, color: colors.textTertiary, letterSpacing: 0.6 },
  infoValue: { ...typography.bodyMedium, color: colors.textPrimary },
  editEmailButton: { minHeight: 44, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs },
  editEmailText: { ...typography.captionMedium, color: colors.accent },
  preferenceCard: { padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  selectedHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  selectionCount: { ...typography.captionMedium, color: colors.accent },
  selectedList: { gap: spacing.xs },
  selectedRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  orderBadge: { width: 24, height: 24, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  orderText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  selectedModuleName: { flex: 1, ...typography.captionMedium, color: colors.textPrimary },
  reorderButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  reorderDisabled: { opacity: 0.35 },
  availableHeading: { ...typography.captionMedium, color: colors.textSecondary, marginTop: spacing.xs },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  moduleOption: { width: '48%', minHeight: 52, flexGrow: 1, flexBasis: '45%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.xs, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  moduleOptionSelected: { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted },
  moduleOptionDisabled: { opacity: 0.5 },
  moduleOptionIcon: { width: 26, alignItems: 'center' },
  moduleOptionName: { flex: 1, minWidth: 0, ...typography.micro, color: colors.textSecondary },
  moduleOptionNameSelected: { color: colors.accentDark, fontWeight: '700' },
  moduleOrder: { fontSize: 10, fontWeight: '800', color: colors.accent },
  preferenceHint: { ...typography.micro, color: colors.textTertiary, lineHeight: 16 },
  saveButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.accent },
  saveButtonDisabled: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  saveButtonText: { ...typography.bodySemibold, color: colors.white },
  saveButtonTextDisabled: { color: colors.textTertiary },
  frequencyCard: { flexDirection: 'row', gap: 6, padding: 6, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  frequencyOption: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingHorizontal: 2 },
  frequencyOptionActive: { backgroundColor: colors.accent },
  frequencyText: { ...typography.micro, color: colors.textSecondary },
  frequencyTextActive: { color: colors.white, fontWeight: '700' },
  reportCard: { padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  reportToggle: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  reportToggleCopy: { flex: 1, gap: 2 },
  reportToggleTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  reportToggleSubtitle: { ...typography.caption, color: colors.textSecondary },
  toggleTrack: { width: 52, height: 30, justifyContent: 'center', padding: 3, borderRadius: 15, backgroundColor: colors.border },
  toggleTrackActive: { backgroundColor: colors.accentDark },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white },
  toggleThumbActive: { alignSelf: 'flex-end' },
  reportDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  reportLabel: { ...typography.micro, color: colors.textTertiary, letterSpacing: 0.7 },
  scheduleGroup: { gap: spacing.xs },
  dayOptions: { gap: spacing.xs, paddingVertical: 2 },
  dayOption: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs, borderRadius: radius.md, backgroundColor: colors.background },
  dayOptionActive: { backgroundColor: colors.accent },
  dayOptionText: { ...typography.captionMedium, color: colors.textSecondary },
  dayOptionTextActive: { color: colors.white, fontWeight: '700' },
  fixedDates: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  fixedDate: { minHeight: 40, textAlignVertical: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.background, ...typography.captionMedium, color: colors.textPrimary },
  monthDayOptions: { gap: spacing.xs, paddingVertical: 2 },
  monthDayOption: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.background },
  monthDayText: { ...typography.captionMedium, color: colors.textSecondary },
  reportHint: { ...typography.micro, color: colors.textTertiary, lineHeight: 17 },
  reportDestination: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: colors.background },
  reportDestinationCopy: { flex: 1, minWidth: 0, gap: 3 },
  reportDestinationEmail: { ...typography.captionMedium, color: colors.textPrimary },
  previewCard: { gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  previewTitle: { ...typography.micro, color: colors.textTertiary, letterSpacing: 0.7 },
  previewDate: { ...typography.captionMedium, color: colors.textPrimary },
  successMessage: { ...typography.caption, color: colors.income },
  errorMessage: { ...typography.caption, color: colors.expense },
  logout: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  logoutText: { ...typography.bodySemibold, color: colors.expense },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  avatarModal: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.background, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, gap: spacing.md },
  modalHandle: { width: 42, height: 4, alignSelf: 'center', borderRadius: 2, backgroundColor: colors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  modalSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  avatarPreview: { width: 92, height: 92, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderRadius: 46, borderWidth: 3, borderColor: colors.accentMuted },
  avatarPreviewEmoji: { fontSize: 54 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  avatarChoice: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarChoiceSelected: { borderColor: colors.accent },
  avatarChoiceEmoji: { fontSize: 38 },
  avatarChoiceCheck: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.background },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  cancelButton: { minHeight: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.surfaceMuted },
  cancelText: { ...typography.bodySemibold, color: colors.textSecondary },
});
