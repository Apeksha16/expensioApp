import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FriendsApiError } from '../services/api/friendsErrors';
import { createDebouncedSearchController } from '../services/friendsSearch';
import {
  formatHandle,
  normalizeHandle,
  sanitizeDisplayText,
  suggestUsernameSlug,
} from '../services/friendsStore';
import { fontFamilies, colors, layout, radius, shadows, spacing, typography } from '../theme';
import type { CreateGuestInput, Friendship, SearchCandidate } from '../types/friends';
import { MAX_GUESTS_PER_OWNER } from '../types/friends';
import { triggerErrorHaptic, triggerSuccessHaptic } from '../utils/haptics';
import { Avatar } from './Avatar';
import { AvatarCarousel } from './AvatarPickerBottomSheet';
import { BottomSheet } from './BottomSheet';
import { CARTOON_AVATARS, CartoonAvatar } from './CartoonAvatar';
import { EmptyState } from './EmptyState';
import { GroupedDivider, GroupedList } from './GroupedList';
import { GuestQuotaRing } from './GuestQuotaRing';
import { InputField } from './InputField';
import { PrimaryButton } from './PrimaryButton';
import { SegmentedControl } from './SegmentedControl';
import { FriendRowSkeleton } from './Skeleton';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string, signal?: AbortSignal) => Promise<SearchCandidate[]>;
  onSendRequest: (candidate: SearchCandidate) => Promise<void>;
  onCreateGuest: (input: CreateGuestInput) => Promise<void>;
  guestCount: number;
  currentUserId?: string | null;
  existingFriendships?: readonly Friendship[];
  initialTab?: 'find' | 'guest';
  returnFocusRef?: React.RefObject<any>;
}

type TabMode = 'find' | 'guest';

const AVATAR_TRAY_HEIGHT = 128;

export function AddFriendSheet({
  visible,
  onClose,
  onSearch,
  onSendRequest,
  onCreateGuest,
  guestCount,
  currentUserId,
  existingFriendships = [],
  initialTab = 'find',
  returnFocusRef,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabMode>(initialTab);

  // Find user state
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<SearchCandidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  // Create guest state
  const [guestName, setGuestName] = useState('');
  const [guestUsername, setGuestUsername] = useState('');
  const [usernameEditedManually, setUsernameEditedManually] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(CARTOON_AVATARS[0].id);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [nameError, setNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [guestFormError, setGuestFormError] = useState('');
  const [creatingGuest, setCreatingGuest] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const guestsRemaining = Math.max(0, MAX_GUESTS_PER_OWNER - guestCount);
  const guestLimitReached = guestsRemaining === 0;

  const drawerAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const searchCallbacksRef = useRef({ onSearch, currentUserId, existingFriendships });
  searchCallbacksRef.current = { onSearch, currentUserId, existingFriendships };

  const searchController = useMemo(
    () =>
      createDebouncedSearchController({
        onSearch: (q, signal) => searchCallbacksRef.current.onSearch(q, signal),
        getContext: () => ({
          currentUserId: searchCallbacksRef.current.currentUserId,
          existingFriendships: searchCallbacksRef.current.existingFriendships,
        }),
        onStateChange: (next) => {
          setSearching(next.searching);
          setSearched(next.searched);
          setCandidates(next.candidates);
          setSearchError(next.error);
        },
      }),
    [],
  );

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: avatarPickerOpen && !guestLimitReached ? 1 : 0,
      duration: reduceMotion ? 0 : 220,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [avatarPickerOpen, drawerAnim, guestLimitReached, reduceMotion]);

  const resetAllState = useCallback(() => {
    searchController.reset();
    drawerAnim.setValue(0);
    setActiveTab(initialTab);
    setQuery('');
    setSelectedCandidateId(null);
    setSendingRequest(false);
    setGuestName('');
    setGuestUsername('');
    setUsernameEditedManually(false);
    setSelectedAvatarId(CARTOON_AVATARS[0].id);
    setAvatarPickerOpen(false);
    setNameError('');
    setUsernameError('');
    setGuestFormError('');
    setCreatingGuest(false);
  }, [initialTab, searchController]);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [initialTab, visible]);

  useEffect(() => {
    if (visible && !avatarPickerOpen && activeTab === 'find') {
      const focusTimer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 220);
      return () => clearTimeout(focusTimer);
    }
  }, [visible, avatarPickerOpen, activeTab]);

  useEffect(() => {
    if (!visible) {
      resetAllState();
    }
    return () => {
      searchController.dispose();
    };
  }, [visible, resetAllState, searchController]);

  const handleClose = useCallback(() => {
    resetAllState();
    onClose();
  }, [onClose, resetAllState]);

  const runSearch = useCallback(
    (rawText: string, immediate = false) => {
      setSelectedCandidateId(null);
      searchController.search(rawText, immediate);
    },
    [searchController],
  );

  const handleQueryChange = (text: string) => {
    const capped = text.slice(0, 60);
    setQuery(capped);
    runSearch(capped, false);
  };

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId) ?? null,
    [candidates, selectedCandidateId],
  );

  const handleSendSelectedRequest = async () => {
    if (!selectedCandidate || sendingRequest) return;
    setSendingRequest(true);
    setSearchError('');
    try {
      await onSendRequest(selectedCandidate);
      triggerSuccessHaptic();
      handleClose();
    } catch (err) {
      triggerErrorHaptic();
      setSearchError(err instanceof Error ? err.message : 'Could not send friend request.');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleGuestNameChange = (val: string) => {
    const capped = val.slice(0, 60);
    setGuestName(capped);
    setNameError('');
    setGuestFormError('');
    if (!usernameEditedManually) {
      setGuestUsername(suggestUsernameSlug(capped));
      setUsernameError('');
    }
  };

  const handleCreateGuest = async () => {
    if (creatingGuest || guestLimitReached) return;
    const trimmedName = sanitizeDisplayText(guestName, 60);
    const cleanedUsername = normalizeHandle(guestUsername);

    let hasError = false;
    if (!trimmedName) {
      setNameError('Display name is required.');
      hasError = true;
    } else if (trimmedName.length < 2) {
      setNameError('Enter at least 2 characters.');
      hasError = true;
    }
    if (!cleanedUsername) {
      setUsernameError('Username is required.');
      hasError = true;
    } else if (!/^[a-zA-Z0-9_.-]{2,30}$/.test(cleanedUsername)) {
      setUsernameError('Use 2-30 letters, numbers, dots, dashes, or underscores.');
      hasError = true;
    }
    if (hasError) {
      triggerErrorHaptic();
      return;
    }

    setCreatingGuest(true);
    setNameError('');
    setUsernameError('');
    setGuestFormError('');
    try {
      await onCreateGuest({
        name: trimmedName,
        username: cleanedUsername,
        avatarId: selectedAvatarId,
      });
      triggerSuccessHaptic();
      handleClose();
    } catch (err) {
      triggerErrorHaptic();
      if (err instanceof FriendsApiError && err.fieldErrors) {
        if (err.fieldErrors.name) setNameError(err.fieldErrors.name);
        if (err.fieldErrors.username) setUsernameError(err.fieldErrors.username);
        if (!err.fieldErrors.name && !err.fieldErrors.username) {
          setGuestFormError(err.message);
        }
      } else {
        setGuestFormError(err instanceof Error ? err.message : 'Unable to create guest participant.');
      }
    } finally {
      setCreatingGuest(false);
    }
  };

  const segmentOptions = useMemo(
    () => [
      { key: 'find' as const, label: 'Find user' },
      { key: 'guest' as const, label: 'Create guest' },
    ],
    [],
  );

  const trayTranslateY = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const chevronRotate = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      fixedHeightRatio={0.68}
      accessibilityLabel="Add friend"
      returnFocusRef={returnFocusRef}
    >
      {/* Single clean title + animated 5-slice guest quota ring next to Close button */}
      <View style={styles.header}>
        <Text style={styles.title}>Add friend</Text>
        <View style={styles.headerActions}>
          <GuestQuotaRing
            used={guestCount}
            total={MAX_GUESTS_PER_OWNER}
            visible={visible}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
            onPress={handleClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          >
            <Ionicons name="close-outline" size={22} color={colors.accentDark} />
          </Pressable>
        </View>
      </View>

      <SegmentedControl
        options={segmentOptions}
        value={activeTab}
        variant="primary"
        onChange={(next) => {
          setActiveTab(next);
          setAvatarPickerOpen(false);
          setSearchError('');
          setGuestFormError('');
        }}
        style={styles.segment}
      />

        {activeTab === 'find' ? (
          <View style={styles.tabBody}>
            {/* Search box pinned at top so results/loading/empty never shift its position */}
            <View style={styles.searchPinWrap}>
              <InputField
                ref={searchInputRef}
                value={query}
                onChangeText={handleQueryChange}
                placeholder="Search by name or @username"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search users by name or username"
                fieldStyle={styles.searchField}
                leftElement={<Ionicons name="search-outline" size={20} color={colors.accent} />}
                rightElement={
                  query ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear search"
                      onPress={() => handleQueryChange('')}
                      style={styles.clearBtn}
                    >
                      <Ionicons name="close-outline" size={20} color={colors.textTertiary} />
                    </Pressable>
                  ) : null
                }
              />
            </View>

            <ScrollView
              style={styles.flexScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsScrollContent}
            >
              {searchError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.expense} />
                  <Text style={styles.errorBannerText} numberOfLines={2}>
                    {searchError}
                  </Text>
                  <PrimaryButton
                    title="Retry"
                    variant="secondary"
                    size="md"
                    onPress={() => runSearch(query, true)}
                    style={styles.retryBtn}
                  />
                </View>
              ) : null}

              {searching ? (
                <GroupedList>
                  <FriendRowSkeleton showDivider />
                  <FriendRowSkeleton showDivider />
                  <FriendRowSkeleton />
                </GroupedList>
              ) : searched && candidates.length === 0 ? (
                <EmptyState
                  compact
                  icon="person-outline"
                  title="No matching users"
                  description={`No eligible accounts matched "${query.trim()}".`}
                  ctaLabel="Create guest instead"
                  onCtaPress={() => {
                    handleGuestNameChange(query.trim());
                    setActiveTab('guest');
                  }}
                />
              ) : !searched && !query.trim() ? (
                <View style={styles.findHeroCard}>
                  <View style={styles.findHeroBadge}>
                    <Ionicons name="people-outline" size={22} color={colors.surprise} />
                  </View>
                  <Text style={styles.findHeroTitle}>Find Expensio friends</Text>
                  <Text style={styles.findHeroSub}>
                    Search by full name or @username to send an instant split invite.
                  </Text>
                  <View style={styles.findHeroHint}>
                    <Ionicons name="at-outline" size={14} color={colors.accent} />
                    <Text style={styles.findHeroHintText}>Try @ananya_v or Priya</Text>
                  </View>
                </View>
              ) : (
                <GroupedList>
                  {candidates.map((candidate, index) => {
                    const isSelected = selectedCandidateId === candidate.id;
                    const handle = formatHandle(candidate.username);
                    return (
                      <View key={candidate.id}>
                        {index > 0 ? <GroupedDivider inset={layout.rowDividerInset} /> : null}
                        <Pressable
                          accessibilityRole="radio"
                          accessibilityLabel={`${candidate.displayName}, ${handle}`}
                          accessibilityState={{ selected: isSelected }}
                          onPress={() => {
                            setSelectedCandidateId(isSelected ? null : candidate.id);
                            setSearchError('');
                          }}
                          style={({ pressed }) => [
                            styles.candidateRow,
                            isSelected && styles.candidateRowSelected,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Avatar
                            id={candidate.id}
                            name={candidate.displayName}
                            presetId={candidate.avatarId}
                            size={44}
                          />

                          <View style={styles.candidateMeta}>
                            <Text style={styles.candidateName} numberOfLines={1}>
                              {candidate.displayName}
                            </Text>
                            <Text style={styles.candidateUsername} numberOfLines={1}>
                              {handle}
                            </Text>
                          </View>

                          <View style={[styles.radioRing, isSelected && styles.radioRingSelected]}>
                            {isSelected ? (
                              <Ionicons name="checkmark-outline" size={16} color={colors.textInverse} />
                            ) : null}
                          </View>
                        </Pressable>
                      </View>
                    );
                  })}
                </GroupedList>
              )}
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            style={styles.flexScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.guestScrollContent}
          >
            {/* Smoothly animated inline rounded-card popover with pre-mounted virtualized carousel */}
            <View style={[styles.avatarPopoverCard, guestLimitReached && styles.disabled]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose guest avatar"
                accessibilityState={{ disabled: guestLimitReached, expanded: avatarPickerOpen }}
                disabled={guestLimitReached}
                onPress={() => setAvatarPickerOpen((prev) => !prev)}
                style={({ pressed }) => [
                  styles.avatarCardHeader,
                  pressed && !guestLimitReached && styles.pressed,
                ]}
              >
                <View style={styles.avatarRingWrap}>
                  <CartoonAvatar id={selectedAvatarId} size={52} />
                </View>
                <View style={styles.avatarCardCopy}>
                  <Text style={styles.avatarCardTitle}>Guest avatar</Text>
                  <Text style={styles.avatarCardSub}>
                    {avatarPickerOpen ? 'Tap to close' : 'Tap to choose'}
                  </Text>
                </View>
                <View style={styles.avatarCardAction}>
                  <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                    <Ionicons name="chevron-down-outline" size={20} color={colors.accentDark} />
                  </Animated.View>
                </View>
              </Pressable>

              {!guestLimitReached && avatarPickerOpen ? (
                <Animated.View
                  style={[
                    styles.avatarPopoverTray,
                    {
                      opacity: drawerAnim,
                      transform: [{ translateY: trayTranslateY }],
                    },
                  ]}
                >
                  <View style={styles.avatarPopoverBody}>
                    <AvatarCarousel
                      selectedAvatarId={selectedAvatarId}
                      onChange={setSelectedAvatarId}
                      showNames={false}
                      containerStyle={styles.inlineCarousel}
                    />
                  </View>
                </Animated.View>
              ) : null}
            </View>

            {guestLimitReached ? (
              <View style={styles.limitBanner}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.expense} />
                <Text style={styles.limitBannerText}>
                  5 of 5 guests used. Remove an existing guest to add a new one.
                </Text>
              </View>
            ) : null}

            <InputField
              label="Display name"
              value={guestName}
              onChangeText={handleGuestNameChange}
              placeholder="e.g. Arjun Sharma"
              autoCapitalize="words"
              maxLength={60}
              editable={!guestLimitReached && !creatingGuest}
              error={nameError || undefined}
            />

            <InputField
              label="Username"
              value={guestUsername}
              onChangeText={(val) => {
                setUsernameEditedManually(true);
                setGuestUsername(val.replace(/^@+/, '').slice(0, 30));
                setUsernameError('');
                setGuestFormError('');
              }}
              placeholder="arjun_sharma"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              editable={!guestLimitReached && !creatingGuest}
              leftElement={<Text style={styles.atPrefix}>@</Text>}
              error={usernameError || undefined}
            />

            <View style={styles.guestNoteBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
              <Text style={styles.guestNote}>
                Guests are participants only. They can&apos;t log in.
              </Text>
            </View>

            {guestFormError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.expense} />
                <Text style={styles.errorBannerText}>{guestFormError}</Text>
              </View>
            ) : null}
          </ScrollView>
        )}

        <View style={styles.stickyFooter}>
          {activeTab === 'find' ? (
            <PrimaryButton
              title={
                selectedCandidate
                  ? `Send request to ${selectedCandidate.displayName.split(' ')[0]}`
                  : 'Select a person to request'
              }
              icon={selectedCandidate ? 'person-add-outline' : undefined}
              variant={selectedCandidate ? 'primary' : 'secondary'}
              loading={sendingRequest}
              disabled={!selectedCandidate || sendingRequest}
              onPress={() => void handleSendSelectedRequest()}
            />
          ) : (
            <PrimaryButton
              title="Create guest"
              variant="primary"
              loading={creatingGuest}
              disabled={creatingGuest || guestLimitReached}
              onPress={() => void handleCreateGuest()}
            />
          )}
        </View>
      </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    zIndex: 20,
  },
  title: {
    ...typography.h2,
    color: colors.accentDark,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    marginBottom: spacing.md,
  },
  tabBody: {
    flex: 1,
    minHeight: 0,
  },
  searchPinWrap: {
    marginBottom: spacing.sm,
  },
  flexScroll: {
    flex: 1,
    minHeight: 0,
  },
  resultsScrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  guestScrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  searchField: {
    borderRadius: radius.full,
    borderColor: colors.accentMuted,
    minHeight: 50,
  },
  findHeroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    paddingVertical: spacing.lg,
    paddingHorizontal: layout.cardPadding,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.soft,
  },
  findHeroBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  findHeroTitle: {
    ...typography.rowTitle,
    color: colors.accentDark,
    textAlign: 'center',
  },
  findHeroSub: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 270,
  },
  findHeroHint: {
    marginTop: spacing.xxs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  findHeroHintText: {
    ...typography.micro,
    color: colors.accentDark,
    fontFamily: fontFamilies.semibold,
  },
  clearBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.xs,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorBannerText: {
    ...typography.caption,
    color: colors.expense,
    flex: 1,
  },
  retryBtn: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  candidateRow: {
    minHeight: layout.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  candidateRowSelected: {
    backgroundColor: colors.accentSoft,
  },
  candidateMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  candidateName: {
    ...typography.rowTitle,
    color: colors.textPrimary,
  },
  candidateUsername: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  radioRing: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioRingSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  avatarPopoverCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    overflow: 'hidden',
    ...shadows.soft,
  },
  avatarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  avatarPopoverTray: {
    overflow: 'hidden',
  },
  avatarPopoverBody: {
    height: AVATAR_TRAY_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: colors.accentMuted,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  inlineCarousel: {
    marginHorizontal: 0,
  },
  avatarRingWrap: {
    width: 58,
    height: 58,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  avatarCardTitle: {
    ...typography.rowTitle,
    color: colors.accentDark,
  },
  avatarCardSub: {
    ...typography.captionMedium,
    color: colors.accent,
  },
  avatarCardAction: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  limitBannerText: {
    ...typography.caption,
    color: colors.expense,
    flex: 1,
  },
  atPrefix: {
    ...typography.bodySemibold,
    color: colors.accent,
  },
  guestNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  guestNote: {
    ...typography.captionMedium,
    color: colors.accentDark,
    flex: 1,
  },
  stickyFooter: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
});
