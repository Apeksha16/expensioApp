import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddFriendSheet } from '../../components/AddFriendSheet';
import { AvatarPickerBottomSheet } from '../../components/AvatarPickerBottomSheet';
import { EmptyState } from '../../components/EmptyState';
import {
  FriendRemovalSheet,
  type RelationshipConfirmMode,
} from '../../components/FriendRemovalSheet';
import { FriendRow, type GroupedCardPosition } from '../../components/FriendRow';
import { GroupedList, SectionEyebrow } from '../../components/GroupedList';
import { InputField } from '../../components/InputField';
import { PersonSheet } from '../../components/PersonSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuotaMeter } from '../../components/QuotaMeter';
import { RequestRow } from '../../components/RequestRow';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenStatusBar } from '../../components/ScreenStatusBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { FriendRowSkeleton } from '../../components/Skeleton';
import { FRIENDS_CONFIG } from '../../config/friendsConfig';
import { useApp } from '../../context/AppContext';
import {
  filterFriendshipsByQuery,
  getAccountDataOwner,
  getInitials,
  sanitizeDisplayText,
} from '../../services/friendsStore';
import { colors, layout, radius, spacing, typography } from '../../theme';
import type { Friendship, PreflightRemovalResult } from '../../types/friends';
import { MAX_GUESTS_PER_OWNER } from '../../types/friends';
import { formatClockTime, formatINR } from '../../utils/format';
import { netWithFriend } from '../../utils/splits';

type SegmentTab = 'friends' | 'requests';

type ListRowItem =
  | {
      id: string;
      kind: 'eyebrow';
      title: string;
      count?: string | number;
      showQuota?: boolean;
    }
  | {
      id: string;
      kind: 'friend-row';
      friendship: Friendship;
      cardPosition: GroupedCardPosition;
      showTopDivider: boolean;
      showGuestBadge: boolean;
    }
  | {
      id: string;
      kind: 'request-row';
      friendship: Friendship;
      cardPosition: GroupedCardPosition;
      showTopDivider: boolean;
    }
  | {
      id: string;
      kind: 'empty';
      section: 'friends' | 'guests' | 'incoming' | 'sent';
    }
  | { id: string; kind: 'spacer' };

function cardPositionForIndex(index: number, total: number): GroupedCardPosition {
  if (total <= 1) return 'single';
  if (index === 0) return 'first';
  if (index === total - 1) return 'last';
  return 'middle';
}

interface FriendsAuditPreview {
  segment?: SegmentTab;
  searchOpen?: boolean;
  filterQuery?: string;
}

export function FriendsScreen({ auditPreview }: { auditPreview?: FriendsAuditPreview } = {}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const {
    profile,
    splits,
    friendships,
    acceptedFriendships,
    incomingFriendships,
    outgoingFriendships,
    friendCounts,
    friendsLoading,
    friendsRefreshing,
    friendsError,
    friendsNormalizedError,
    friendsSyncMeta,
    pendingFriendActionIds,
    addFriendTriggerCount,
    setFriendsScreenVisible,
    clearNewIncomingAlert,
    refreshFriends,
    searchFriendCandidates,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    checkFriendRemovalPreflight,
    createGuestFriend,
    updateGuestAvatar,
    setAuthPhase,
  } = useApp();

  const [segment, setSegment] = useState<SegmentTab>(() =>
    auditPreview?.segment ?? (incomingFriendships.length > 0 ? 'requests' : 'friends'),
  );
  const hasAutoSelectedSegmentRef = useRef(
    Boolean(auditPreview?.segment) || incomingFriendships.length > 0,
  );
  const [searchOpen, setSearchOpen] = useState(auditPreview?.searchOpen ?? false);
  const [filterQuery, setFilterQuery] = useState(auditPreview?.filterQuery ?? '');
  const [addSheetState, setAddSheetState] = useState<{
    visible: boolean;
    initialTab: 'find' | 'guest';
  }>({ visible: false, initialTab: 'find' });
  const [personSheetTarget, setPersonSheetTarget] = useState<Friendship | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    friendship: Friendship;
    mode: RelationshipConfirmMode;
  } | null>(null);
  const [removalPreflight, setRemovalPreflight] = useState<PreflightRemovalResult>({
    canRemove: true,
    blockedByDebt: false,
    unsettledAmount: 0,
  });
  const [guestEditorTarget, setGuestEditorTarget] = useState<Friendship | null>(null);
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);

  const addTriggerRef = useRef(addFriendTriggerCount);
  const modalTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (modalTransitionTimerRef.current) {
        clearTimeout(modalTransitionTimerRef.current);
      }
    };
  }, []);

  const runAfterSheetDismiss = useCallback((action: () => void) => {
    if (modalTransitionTimerRef.current) {
      clearTimeout(modalTransitionTimerRef.current);
    }
    const delay = Platform.OS === 'ios' ? 240 : 0;
    if (delay === 0) {
      action();
      return;
    }
    modalTransitionTimerRef.current = setTimeout(() => {
      modalTransitionTimerRef.current = null;
      action();
    }, delay);
  }, []);

  useEffect(() => {
    if (!hasAutoSelectedSegmentRef.current && !friendsLoading && incomingFriendships.length > 0) {
      hasAutoSelectedSegmentRef.current = true;
      setSegment('requests');
    }
  }, [friendsLoading, incomingFriendships.length]);

  useFocusEffect(
    useCallback(() => {
      setFriendsScreenVisible(true);
      return () => {
        setFriendsScreenVisible(false);
      };
    }, [setFriendsScreenVisible]),
  );

  useEffect(() => {
    if (addFriendTriggerCount > addTriggerRef.current) {
      addTriggerRef.current = addFriendTriggerCount;
      setAddSheetState({ visible: true, initialTab: 'find' });
    }
  }, [addFriendTriggerCount]);

  const totalRelationships = friendships.length;
  const searchAllowed = totalRelationships >= FRIENDS_CONFIG.SEARCH_REVEAL_THRESHOLD;

  useEffect(() => {
    if (!searchAllowed && (searchOpen || filterQuery)) {
      setSearchOpen(false);
      setFilterQuery('');
    }
  }, [filterQuery, searchAllowed, searchOpen]);

  const handleSegmentChange = useCallback(
    (next: SegmentTab) => {
      setActiveSwipeId(null);
      if (next === 'requests') {
        clearNewIncomingAlert();
      }
      setSegment(next);
    },
    [clearNewIncomingAlert],
  );

  const openConfirmSheet = useCallback(
    async (friendship: Friendship, mode: RelationshipConfirmMode) => {
      if (mode === 'remove') {
        const preflight = await checkFriendRemovalPreflight(friendship.friendshipId);
        setRemovalPreflight(preflight);
      } else {
        setRemovalPreflight({ canRemove: true, blockedByDebt: false, unsettledAmount: 0 });
      }
      setConfirmTarget({ friendship, mode });
    },
    [checkFriendRemovalPreflight],
  );

  const handleAccept = useCallback(
    async (friendship: Friendship) => {
      clearNewIncomingAlert();
      const safeName = sanitizeDisplayText(friendship.person.displayName) || 'Friend';
      try {
        await acceptFriendRequest(friendship.friendshipId);
        AccessibilityInfo.announceForAccessibility?.(`${safeName} added to Friends.`);
      } catch (err) {
        AccessibilityInfo.announceForAccessibility?.(
          err instanceof Error ? err.message : 'Unable to accept friend request.',
        );
      }
    },
    [acceptFriendRequest, clearNewIncomingAlert],
  );

  const handleConfirmAction = useCallback(
    async (friendshipId: string) => {
      if (!confirmTarget) return;
      const { mode, friendship } = confirmTarget;
      const safeName = sanitizeDisplayText(friendship.person.displayName) || 'Friend';
      if (mode === 'decline') {
        await declineFriendRequest(friendshipId);
        AccessibilityInfo.announceForAccessibility?.(`Declined request from ${safeName}.`);
      } else if (mode === 'cancel') {
        await cancelFriendRequest(friendshipId);
        AccessibilityInfo.announceForAccessibility?.(`Cancelled request to ${safeName}.`);
      } else {
        await removeFriend(friendshipId);
        AccessibilityInfo.announceForAccessibility?.(`Removed ${safeName} from Friends.`);
      }
    },
    [cancelFriendRequest, confirmTarget, declineFriendRequest, removeFriend],
  );

  const netAmounts = useMemo(() => {
    if (!FRIENDS_CONFIG.ENABLE_SPLIT_BALANCE_CHIPS) return new Map<string, number>();
    const map = new Map<string, number>();
    acceptedFriendships.forEach((item) => {
      const net = netWithFriend(splits, item.person.id);
      if (net !== 0) map.set(item.person.id, net);
    });
    return map;
  }, [acceptedFriendships, splits]);

  const filteredAccepted = useMemo(
    () => filterFriendshipsByQuery(acceptedFriendships, filterQuery),
    [acceptedFriendships, filterQuery],
  );
  const filteredPeople = useMemo(
    () => filteredAccepted.filter((item) => !item.person.isGuest),
    [filteredAccepted],
  );
  const filteredGuests = useMemo(
    () => filteredAccepted.filter((item) => item.person.isGuest),
    [filteredAccepted],
  );
  const filteredIncoming = useMemo(
    () => filterFriendshipsByQuery(incomingFriendships, filterQuery),
    [incomingFriendships, filterQuery],
  );
  const filteredOutgoing = useMemo(
    () => filterFriendshipsByQuery(outgoingFriendships, filterQuery),
    [outgoingFriendships, filterQuery],
  );

  const listData = useMemo<ListRowItem[]>(() => {
    const rows: ListRowItem[] = [];

    if (segment === 'friends') {
      if (filteredPeople.length === 0 && filteredGuests.length === 0 && filterQuery.trim().length > 0) {
        rows.push({ id: 'empty-friends', kind: 'empty', section: 'friends' });
        return rows;
      }

      rows.push({
        id: 'eyebrow-connections',
        kind: 'eyebrow',
        title: 'Connections',
        count: filteredPeople.length,
      });

      if (filteredPeople.length === 0) {
        rows.push({ id: 'empty-friends', kind: 'empty', section: 'friends' });
      } else {
        filteredPeople.forEach((friendship, idx) => {
          rows.push({
            id: `friend-${friendship.friendshipId}`,
            kind: 'friend-row',
            friendship,
            cardPosition: cardPositionForIndex(idx, filteredPeople.length),
            showTopDivider: idx > 0,
            showGuestBadge: false,
          });
        });
      }

      rows.push({ id: 'spacer-people-guests', kind: 'spacer' });

      rows.push({
        id: 'eyebrow-guests',
        kind: 'eyebrow',
        title: 'Guests',
        showQuota: true,
      });

      if (filteredGuests.length === 0) {
        rows.push({ id: 'empty-guests', kind: 'empty', section: 'guests' });
      } else {
        filteredGuests.forEach((friendship, idx) => {
          rows.push({
            id: `guest-${friendship.friendshipId}`,
            kind: 'friend-row',
            friendship,
            cardPosition: cardPositionForIndex(idx, filteredGuests.length),
            showTopDivider: idx > 0,
            showGuestBadge: true,
          });
        });
      }
      return rows;
    }

    rows.push({
      id: 'eyebrow-incoming',
      kind: 'eyebrow',
      title: 'Incoming',
      count: filteredIncoming.length,
    });
    if (filteredIncoming.length === 0) {
      rows.push({ id: 'empty-incoming', kind: 'empty', section: 'incoming' });
    } else {
      filteredIncoming.forEach((friendship, idx) => {
        rows.push({
          id: `incoming-${friendship.friendshipId}`,
          kind: 'request-row',
          friendship,
          cardPosition: cardPositionForIndex(idx, filteredIncoming.length),
          showTopDivider: idx > 0,
        });
      });
    }

    rows.push({ id: 'spacer-req', kind: 'spacer' });

    rows.push({
      id: 'eyebrow-sent',
      kind: 'eyebrow',
      title: 'Sent',
      count: filteredOutgoing.length,
    });
    if (filteredOutgoing.length === 0) {
      rows.push({ id: 'empty-sent', kind: 'empty', section: 'sent' });
    } else {
      filteredOutgoing.forEach((friendship, idx) => {
        rows.push({
          id: `outgoing-${friendship.friendshipId}`,
          kind: 'request-row',
          friendship,
          cardPosition: cardPositionForIndex(idx, filteredOutgoing.length),
          showTopDivider: idx > 0,
        });
      });
    }

    return rows;
  }, [
    filterQuery,
    filteredGuests,
    filteredIncoming,
    filteredOutgoing,
    filteredPeople,
    segment,
  ]);

  const canGoBack = navigation.canGoBack();
  const currentOwnerId = getAccountDataOwner(profile);

  const navigateToSplits = useCallback(() => {
    const state = navigation.getState();
    const nav = navigation as unknown as {
      navigate: (name: string, params?: Record<string, unknown>) => void;
    };
    if (state?.routeNames?.includes('SplitHome')) {
      nav.navigate('SplitHome');
      return;
    }
    nav.navigate('Split', { screen: 'SplitHome' });
  }, [navigation]);

  const segmentOptions = useMemo(
    () => [
      { key: 'friends' as const, label: 'Friends' },
      {
        key: 'requests' as const,
        label: 'Requests',
        badgeCount: friendCounts.incoming > 0 ? friendCounts.incoming : undefined,
        hasDot: friendCounts.incoming === 0 && friendsSyncMeta.hasNewIncomingAlert,
      },
    ],
    [friendCounts.incoming, friendsSyncMeta.hasNewIncomingAlert],
  );

  const handleOpenAdd = useCallback((initialTab: 'find' | 'guest' = 'find') => {
    setActiveSwipeId(null);
    setAddSheetState({ visible: true, initialTab });
  }, []);

  const handleRowPress = useCallback((friendship: Friendship) => {
    if (activeSwipeId === friendship.friendshipId) {
      setActiveSwipeId(null);
      return;
    }
    setActiveSwipeId(null);
    setPersonSheetTarget(friendship);
  }, [activeSwipeId]);

  const handleRowRemove = useCallback((friendship: Friendship) => {
    setActiveSwipeId(null);
    void openConfirmSheet(friendship, 'remove');
  }, [openConfirmSheet]);

  const renderItem = useCallback(
    ({ item }: { item: ListRowItem }) => {
      switch (item.kind) {
        case 'eyebrow':
          return (
            <SectionEyebrow
              title={item.title}
              count={item.count}
              rightElement={
                item.showQuota ? (
                  <QuotaMeter
                    used={friendCounts.guests}
                    total={MAX_GUESTS_PER_OWNER}
                    label={`${friendCounts.guests} of ${MAX_GUESTS_PER_OWNER}`}
                  />
                ) : undefined
              }
            />
          );

        case 'spacer':
          return <View style={styles.sectionSpacer} />;

        case 'friend-row': {
          const { friendship, cardPosition, showTopDivider, showGuestBadge } = item;
          const isPending = pendingFriendActionIds.includes(friendship.friendshipId);
          const net = netAmounts.get(friendship.person.id);
          const balanceChip =
            net !== undefined && net !== 0
              ? net > 0
                ? `Owes ${formatINR(net)}`
                : `You owe ${formatINR(Math.abs(net))}`
              : undefined;

          return (
            <FriendRow
              grouped
              cardPosition={cardPosition}
              showTopDivider={showTopDivider}
              showGuestBadge={showGuestBadge}
              friend={{
                id: friendship.person.id,
                name: friendship.person.displayName,
                userId: friendship.person.username,
                initials: getInitials(friendship.person.displayName),
                color: colors.accent,
                avatarId: friendship.person.avatarId,
                avatarUri: friendship.person.avatarUri ?? null,
                isGuest: friendship.person.isGuest,
                friendshipId: friendship.friendshipId,
                ownerUserId: friendship.person.ownerUserId,
              }}
              rightLabel={balanceChip}
              rightTone={net && net > 0 ? 'owed' : net && net < 0 ? 'owe' : 'neutral'}
              actionLoading={isPending}
              swipeOpen={activeSwipeId === friendship.friendshipId}
              onSwipeOpen={() => setActiveSwipeId(friendship.friendshipId)}
              onSwipeClose={() =>
                setActiveSwipeId((curr) =>
                  curr === friendship.friendshipId ? null : curr,
                )
              }
              onPress={() => handleRowPress(friendship)}
              onRemove={() => handleRowRemove(friendship)}
            />
          );
        }

        case 'request-row': {
          const { friendship, cardPosition, showTopDivider } = item;
          const isPending = pendingFriendActionIds.includes(friendship.friendshipId);
          return (
            <RequestRow
              friendship={friendship}
              cardPosition={cardPosition}
              showTopDivider={showTopDivider}
              loading={isPending}
              onAccept={() => void handleAccept(friendship)}
              onDecline={() => void openConfirmSheet(friendship, 'decline')}
              onCancel={() => void openConfirmSheet(friendship, 'cancel')}
            />
          );
        }

        case 'empty': {
          const isFiltered = filterQuery.trim().length > 0;
          if (item.section === 'guests') {
            return (
              <EmptyState
                compact
                icon="person-add-outline"
                title={isFiltered ? 'No matching guests' : 'No guests yet'}
                description={
                  isFiltered
                    ? 'Clear your search to see all guests.'
                    : 'Add offline participants to split expenses together.'
                }
                ctaLabel={isFiltered ? undefined : 'Add guest'}
                onCtaPress={isFiltered ? undefined : () => handleOpenAdd('guest')}
              />
            );
          }
          if (item.section === 'incoming') {
            return (
              <EmptyState
                compact
                icon="mail-outline"
                title={isFiltered ? 'No matching requests' : 'No incoming requests'}
                description={
                  isFiltered
                    ? 'Clear your search to see all incoming requests.'
                    : 'Requests sent to your @username appear here.'
                }
              />
            );
          }
          if (item.section === 'sent') {
            return (
              <EmptyState
                compact
                icon="paper-plane-outline"
                title={isFiltered ? 'No matching sent requests' : 'No sent requests'}
                description={
                  isFiltered
                    ? 'Clear your search to see all sent requests.'
                    : 'Requests you send stay here until accepted.'
                }
                ctaLabel={isFiltered ? undefined : 'Find people'}
                ctaIcon={isFiltered ? undefined : 'search-outline'}
                onCtaPress={isFiltered ? undefined : () => handleOpenAdd('find')}
              />
            );
          }
          return (
            <EmptyState
              compact
              icon="people-outline"
              title={isFiltered ? 'No matching friends' : 'No connections yet'}
              description={
                isFiltered
                  ? `Nobody matched "${sanitizeDisplayText(filterQuery, 40)}".`
                  : 'Find Expensio users to split expenses together.'
              }
              ctaLabel={isFiltered ? 'Clear search' : 'Find people'}
              ctaIcon={isFiltered ? 'close-outline' : 'search-outline'}
              onCtaPress={
                isFiltered
                  ? () => setFilterQuery('')
                  : () => handleOpenAdd('find')
              }
            />
          );
        }
      }
    },
    [
      activeSwipeId,
      filterQuery,
      friendCounts.guests,
      handleAccept,
      handleOpenAdd,
      handleRowPress,
      handleRowRemove,
      netAmounts,
      openConfirmSheet,
      pendingFriendActionIds,
    ],
  );

  const listHeader = useMemo(() => {
    const showSearch = searchAllowed && searchOpen;
    const showOffline = friendsSyncMeta.isStaleOffline;
    const showError = Boolean(friendsError && !friendsSyncMeta.isStaleOffline);
    if (!showSearch && !showOffline && !showError) {
      return undefined;
    }

    const offlineTime = formatClockTime(friendsSyncMeta.lastUpdatedAt);
    return (
      <View style={styles.listHeader}>
        {showSearch ? (
          <InputField
            value={filterQuery}
            onChangeText={(val) => setFilterQuery(val.slice(0, 60))}
            maxLength={60}
            placeholder="Search friends or @username"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search loaded friends"
            fieldStyle={styles.searchField}
            leftElement={<Ionicons name="search-outline" size={20} color={colors.textTertiary} />}
            rightElement={
              filterQuery ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  onPress={() => setFilterQuery('')}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-outline" size={20} color={colors.textTertiary} />
                </Pressable>
              ) : null
            }
          />
        ) : null}

        {showOffline ? (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={20} color={colors.warning} />
            <Text style={styles.offlineText}>
              {offlineTime ? `Offline · last updated ${offlineTime}` : 'Offline · showing saved data'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry syncing friends"
              onPress={() => void refreshFriends()}
              style={styles.bannerAction}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.accentDark} />
            </Pressable>
          </View>
        ) : null}

        {showError ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={20} color={colors.expense} />
            <Text style={styles.errorBannerText} numberOfLines={2}>
              {friendsError}
            </Text>
            {friendsNormalizedError?.action === 'relogin' ? (
              <PrimaryButton
                title="Sign in"
                variant="danger"
                size="md"
                onPress={() => setAuthPhase('login')}
                style={styles.bannerBtn}
              />
            ) : (
              <PrimaryButton
                title="Retry"
                variant="danger"
                size="md"
                onPress={() => void refreshFriends()}
                style={styles.bannerBtn}
              />
            )}
          </View>
        ) : null}
      </View>
    );
  }, [
    filterQuery,
    friendsError,
    friendsNormalizedError?.action,
    friendsSyncMeta.isStaleOffline,
    friendsSyncMeta.lastUpdatedAt,
    refreshFriends,
    searchAllowed,
    searchOpen,
    setAuthPhase,
  ]);

  const headerRight = (
    <View style={styles.headerActions}>
      {searchAllowed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={searchOpen ? 'Close search' : 'Search friends'}
          onPress={() => {
            if (searchOpen) {
              setSearchOpen(false);
              setFilterQuery('');
            } else {
              setSearchOpen(true);
            }
          }}
          style={({ pressed }) => [styles.circleBtn, pressed && styles.circleBtnPressed]}
        >
          <Ionicons
            name={searchOpen ? 'close-outline' : 'search-outline'}
            size={20}
            color={colors.textPrimary}
          />
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add friend or guest"
        onPress={() => handleOpenAdd('find')}
        style={({ pressed }) => [styles.circleBtnPrimary, pressed && styles.circleBtnPrimaryPressed]}
      >
        <Ionicons name="add" size={22} color={colors.textInverse} />
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenStatusBar surface="light" focused={isFocused} />

      <View style={styles.stickyChrome}>
        <ScreenHeader
          tone="light"
          title="Friends"
          onBack={canGoBack ? () => navigation.goBack() : undefined}
          rightElement={headerRight}
        />

        <SegmentedControl
          options={segmentOptions}
          value={segment}
          onChange={handleSegmentChange}
        />
      </View>

      <View style={styles.viewport}>
        {friendsLoading && friendships.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <GroupedList>
              <FriendRowSkeleton showDivider />
              <FriendRowSkeleton showDivider />
              <FriendRowSkeleton showDivider />
              <FriendRowSkeleton />
            </GroupedList>
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => setActiveSwipeId(null)}
            removeClippedSubviews={Platform.OS !== 'web'}
            initialNumToRender={14}
            maxToRenderPerBatch={12}
            windowSize={7}
            refreshControl={
              <RefreshControl
                refreshing={friendsRefreshing}
                onRefresh={() => void refreshFriends()}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
          />
        )}

        <LinearGradient
          pointerEvents="none"
          colors={[colors.background, colors.backgroundTransparent]}
          style={styles.topFade}
        />
      </View>

      <PersonSheet
        visible={personSheetTarget !== null}
        friendship={personSheetTarget}
        currentOwnerId={currentOwnerId}
        onClose={() => setPersonSheetTarget(null)}
        onViewSplits={navigateToSplits}
        onEditAvatar={(target) => runAfterSheetDismiss(() => setGuestEditorTarget(target))}
        onRemove={(target) => runAfterSheetDismiss(() => void openConfirmSheet(target, 'remove'))}
      />

      <AddFriendSheet
        visible={addSheetState.visible}
        initialTab={addSheetState.initialTab}
        onClose={() => setAddSheetState((prev) => ({ ...prev, visible: false }))}
        onSearch={searchFriendCandidates}
        onSendRequest={sendFriendRequest}
        onCreateGuest={createGuestFriend}
        guestCount={friendCounts.guests}
        currentUserId={profile?.id || profile?.userId}
        existingFriendships={friendships}
      />

      <FriendRemovalSheet
        visible={confirmTarget !== null}
        friendship={confirmTarget?.friendship ?? null}
        mode={confirmTarget?.mode ?? 'remove'}
        preflightCheck={removalPreflight}
        onClose={() => setConfirmTarget(null)}
        onConfirmRemove={handleConfirmAction}
        onNavigateToSplits={() => {
          setConfirmTarget(null);
          navigateToSplits();
        }}
      />

      <AvatarPickerBottomSheet
        visible={guestEditorTarget !== null}
        selectedAvatarId={guestEditorTarget?.person.avatarId}
        title="Choose guest avatar"
        confirmLabel="Save guest avatar"
        showNames={false}
        onSelect={(avatarId) => {
          if (!guestEditorTarget) return;
          const targetId = guestEditorTarget.person.id;
          setGuestEditorTarget(null);
          void updateGuestAvatar(targetId, { avatarId });
        }}
        onClose={() => setGuestEditorTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stickyChrome: {
    paddingHorizontal: layout.screenMargin,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    backgroundColor: colors.background,
    zIndex: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  circleBtn: {
    width: layout.headerButtonSize,
    height: layout.headerButtonSize,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  circleBtnPrimary: {
    width: layout.headerButtonSize,
    height: layout.headerButtonSize,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnPrimaryPressed: {
    opacity: 0.88,
  },
  viewport: {
    flex: 1,
    position: 'relative',
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: layout.bottomFadeHeight,
    zIndex: 1,
  },
  skeletonWrap: {
    paddingHorizontal: layout.screenMargin,
    paddingTop: spacing.md,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: layout.screenMargin,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  listHeader: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchField: {
    minHeight: 48,
    borderRadius: radius.full,
  },
  clearBtn: {
    width: layout.headerButtonSize,
    height: layout.headerButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.xs,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  offlineText: {
    ...typography.captionMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  bannerAction: {
    width: layout.headerButtonSize,
    height: layout.headerButtonSize,
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
  bannerBtn: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  sectionSpacer: {
    height: layout.sectionGap,
  },
});
