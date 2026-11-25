import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  findNodeHandle,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radius, shadows, spacing, typography } from '../theme';
import {
  CARTOON_AVATARS,
  CartoonAvatar,
  type CartoonAvatarMeta,
} from './CartoonAvatar';

const ITEM_WIDTH = 110;
const SNAP_INTERVAL = ITEM_WIDTH;
const REPEAT_SETS = 5; // 5 repeats * 8 avatars = 40 items (instant mount, infinite seamless scroll)
const MIDDLE_SET = 2;

const INFINITE_AVATARS: Array<CartoonAvatarMeta & { key: string; listIndex: number }> = [];
for (let set = 0; set < REPEAT_SETS; set++) {
  CARTOON_AVATARS.forEach((avatar, idx) => {
    INFINITE_AVATARS.push({
      ...avatar,
      key: `${avatar.id}-${set}-${idx}`,
      listIndex: set * CARTOON_AVATARS.length + idx,
    });
  });
}

interface AvatarPickerBottomSheetProps {
  visible: boolean;
  selectedAvatarId?: string | null;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
  title?: string;
  confirmLabel?: string;
  showNames?: boolean;
  returnFocusRef?: React.RefObject<any>;
}

interface CarouselItemProps {
  item: typeof INFINITE_AVATARS[0];
  index: number;
  scrollX: Animated.Value;
  showName: boolean;
  onPress: () => void;
}

const AvatarCarouselItem = React.memo(function AvatarCarouselItem({
  item,
  index,
  scrollX,
  showName,
  onPress,
}: CarouselItemProps) {
  const itemCenter = index * SNAP_INTERVAL;

  // Smooth native interpolation as the avatar approaches dead-center
  const scale = scrollX.interpolate({
    inputRange: [itemCenter - SNAP_INTERVAL, itemCenter, itemCenter + SNAP_INTERVAL],
    outputRange: [0.82, 1.15, 0.82],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange: [itemCenter - SNAP_INTERVAL, itemCenter, itemCenter + SNAP_INTERVAL],
    outputRange: [0.55, 1, 0.55],
    extrapolate: 'clamp',
  });

  const ringOpacity = scrollX.interpolate({
    inputRange: [itemCenter - SNAP_INTERVAL * 0.55, itemCenter, itemCenter + SNAP_INTERVAL * 0.55],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const textOpacity = scrollX.interpolate({
    inputRange: [itemCenter - SNAP_INTERVAL * 0.65, itemCenter, itemCenter + SNAP_INTERVAL * 0.65],
    outputRange: [0.55, 1, 0.55],
    extrapolate: 'clamp',
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Select avatar ${item.name}`}
      style={styles.itemColumn}
    >
      <Animated.View
        style={[
          styles.itemAnimatedWrap,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        {/* Pure circular avatar container rasterized as GPU texture for smooth 60fps scroll */}
        <View
          shouldRasterizeIOS
          renderToHardwareTextureAndroid
          style={styles.circleContainer}
        >
          <CartoonAvatar id={item.id} size={78} />
        </View>

        {/* Active circular outline ring */}
        <Animated.View
          pointerEvents="none"
          style={[styles.activeRing, { opacity: ringOpacity }]}
        />

        {/* Active circular checkmark badge */}
        <Animated.View
          pointerEvents="none"
          style={[styles.checkBadge, { opacity: ringOpacity }]}
        >
          <Ionicons name="checkmark" size={13} color={colors.white} />
        </Animated.View>
      </Animated.View>

      {/* Name below avatar (pure native-driver opacity) */}
      {showName ? (
        <Animated.Text
          style={[
            styles.avatarNameText,
            { opacity: textOpacity },
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Animated.Text>
      ) : null}
    </Pressable>
  );
});

export interface AvatarCarouselProps {
  selectedAvatarId?: string | null;
  onChange?: (avatarId: string) => void;
  showNames?: boolean;
  containerStyle?: ViewStyle;
}

export function AvatarCarousel({
  selectedAvatarId,
  onChange,
  showNames = true,
  containerStyle,
}: AvatarCarouselProps) {
  const [containerWidth, setContainerWidth] = useState(() => Dimensions.get('window').width);
  const sidePadding = Math.max(0, (containerWidth - ITEM_WIDTH) / 2);

  const initialLoopedIndex = useMemo(() => {
    const baseIndex = Math.max(
      0,
      CARTOON_AVATARS.findIndex((a) => a.id === selectedAvatarId),
    );
    return MIDDLE_SET * CARTOON_AVATARS.length + (baseIndex >= 0 ? baseIndex : 0);
  }, []);

  const activeIndexRef = useRef(initialLoopedIndex);
  const listRef = useRef<FlatList<(typeof INFINITE_AVATARS)[number]>>(null);
  const scrollX = useRef(new Animated.Value(initialLoopedIndex * SNAP_INTERVAL)).current;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const targetBase = Math.max(
      0,
      CARTOON_AVATARS.findIndex((a) => a.id === selectedAvatarId),
    );
    const currentAvatar = CARTOON_AVATARS[activeIndexRef.current % CARTOON_AVATARS.length];
    if (currentAvatar?.id === selectedAvatarId) return;
    const targetIndex = MIDDLE_SET * CARTOON_AVATARS.length + (targetBase >= 0 ? targetBase : 0);
    activeIndexRef.current = targetIndex;
    scrollX.setValue(targetIndex * SNAP_INTERVAL);
    listRef.current?.scrollToOffset({
      offset: targetIndex * SNAP_INTERVAL,
      animated: false,
    });
  }, [scrollX, selectedAvatarId]);

  const commitSettledIndex = useCallback(
    (offsetX: number, allowLoopReset: boolean) => {
      const rawIndex = Math.round(offsetX / SNAP_INTERVAL);
      const bounded = Math.max(0, Math.min(INFINITE_AVATARS.length - 1, rawIndex));
      let nextIndex = bounded;

      if (allowLoopReset && (bounded < CARTOON_AVATARS.length || bounded >= CARTOON_AVATARS.length * 4)) {
        nextIndex = MIDDLE_SET * CARTOON_AVATARS.length + (bounded % CARTOON_AVATARS.length);
        const normalizedOffset = nextIndex * SNAP_INTERVAL;
        listRef.current?.scrollToOffset({ offset: normalizedOffset, animated: false });
        scrollX.setValue(normalizedOffset);
      }

      if (nextIndex !== activeIndexRef.current) {
        activeIndexRef.current = nextIndex;
        const selected = CARTOON_AVATARS[nextIndex % CARTOON_AVATARS.length];
        if (selected) onChangeRef.current?.(selected.id);
      }
    },
    [scrollX],
  );

  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityX = Math.abs(event.nativeEvent.velocity?.x ?? 0);
      if (velocityX < 0.05) {
        commitSettledIndex(event.nativeEvent.contentOffset.x, true);
      }
    },
    [commitSettledIndex],
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      commitSettledIndex(event.nativeEvent.contentOffset.x, true);
    },
    [commitSettledIndex],
  );

  const scrollToItem = useCallback((index: number) => {
    activeIndexRef.current = index;
    const selected = CARTOON_AVATARS[index % CARTOON_AVATARS.length];
    if (selected) onChangeRef.current?.(selected.id);
    listRef.current?.scrollToOffset({
      offset: index * SNAP_INTERVAL,
      animated: true,
    });
  }, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<(typeof INFINITE_AVATARS)[number]> | null | undefined, index: number) => ({
      length: SNAP_INTERVAL,
      offset: SNAP_INTERVAL * index,
      index,
    }),
    [],
  );

  const renderCarouselItem = useCallback(
    ({ item, index }: { item: (typeof INFINITE_AVATARS)[number]; index: number }) => (
      <AvatarCarouselItem
        item={item}
        index={index}
        scrollX={scrollX}
        showName={showNames}
        onPress={() => scrollToItem(index)}
      />
    ),
    [scrollToItem, scrollX, showNames],
  );

  const scrollEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: true,
      }),
    [scrollX],
  );

  return (
    <View
      style={[
        styles.carouselContainer,
        !showNames && styles.carouselContainerCompact,
        containerStyle,
      ]}
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width;
        if (width > 0 && Math.abs(width - containerWidth) > 1) {
          setContainerWidth(width);
          requestAnimationFrame(() => {
            listRef.current?.scrollToOffset({
              offset: activeIndexRef.current * SNAP_INTERVAL,
              animated: false,
            });
          });
        }
      }}
    >
      <Animated.FlatList
        ref={listRef as any}
        horizontal
        data={INFINITE_AVATARS}
        keyExtractor={(item) => item.key}
        renderItem={renderCarouselItem}
        getItemLayout={getItemLayout}
        initialScrollIndex={initialLoopedIndex}
        initialNumToRender={5}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={Platform.OS !== 'web'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: sidePadding }}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={scrollEvent}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        keyboardShouldPersistTaps="always"
      />
    </View>
  );
}

export function AvatarPickerBottomSheet({
  visible,
  selectedAvatarId,
  onSelect,
  onClose,
  title = 'Choose your avatar',
  confirmLabel = 'Set as profile avatar',
  showNames = true,
  returnFocusRef,
}: AvatarPickerBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [draftAvatarId, setDraftAvatarId] = useState<string>(
    selectedAvatarId ?? CARTOON_AVATARS[0].id,
  );

  // Modal entrance / exit animation
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      setDraftAvatarId(selectedAvatarId ?? CARTOON_AVATARS[0].id);

      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });
      return () => backHandler.remove();
    } else if (isRendered) {
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsRendered(false);
      });
    }
  }, [visible, selectedAvatarId, sheetAnim]);

  const handleClose = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsRendered(false);
      if (returnFocusRef?.current) {
        const node = findNodeHandle(returnFocusRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }
      onClose();
    });
  };

  const handleConfirm = () => {
    onSelect(draftAvatarId);
    handleClose();
  };

  if (!isRendered) return null;

  const activeAvatar = CARTOON_AVATARS.find((a) => a.id === draftAvatarId) ?? CARTOON_AVATARS[0];

  const backdropOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <Modal
      transparent
      visible={isRendered}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Dimmed backdrop */}
        <Animated.View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable
            accessible={false}
            importantForAccessibility="no"
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Slide-up Sheet */}
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={title}
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: sheetTranslateY }],
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            },
          ]}
        >
          {/* Sheet Handle */}
          <View style={styles.sheetHandleWrap}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Header without subheading */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close avatar picker"
              hitSlop={10}
              onPress={handleClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={colors.accentDark} />
            </Pressable>
          </View>

          {/* Smooth Infinite Horizontal Carousel */}
          <AvatarCarousel
            selectedAvatarId={draftAvatarId}
            onChange={setDraftAvatarId}
            showNames={showNames}
          />

          {/* Confirm Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Select ${activeAvatar.name} avatar`}
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.selectButton,
              pressed && styles.selectButtonPressed,
            ]}
          >
            <Text style={styles.selectButtonText}>
              {confirmLabel}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.sm,
    paddingHorizontal: layout.screenMargin,
    gap: spacing.md,
    ...shadows.card,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxs,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.xxs,
    backgroundColor: colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxs,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.accentDark,
  },
  closeButton: {
    width: layout.headerButtonSize,
    height: layout.headerButtonSize,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselContainer: {
    height: 156,
    justifyContent: 'center',
    marginHorizontal: -layout.screenMargin,
  },
  carouselContainerCompact: {
    height: 112,
  },
  itemColumn: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  itemAnimatedWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleContainer: {
    width: 82,
    height: 82,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  activeRing: {
    position: 'absolute',
    top: spacing.xxs,
    left: spacing.xxs,
    right: spacing.xxs,
    bottom: spacing.xxs,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.accentDark,
  },
  checkBadge: {
    position: 'absolute',
    right: spacing.xxs,
    bottom: spacing.xxs,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.accentDark,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarNameText: {
    ...typography.captionMedium,
    color: colors.accentDark,
    fontWeight: '700',
    textAlign: 'center',
  },
  selectButton: {
    height: layout.buttonHeight,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  selectButtonPressed: {
    opacity: 0.9,
  },
  selectButtonText: {
    ...typography.bodySemibold,
    color: colors.textInverse,
  },
});
