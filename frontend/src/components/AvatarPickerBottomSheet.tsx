import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
}

interface CarouselItemProps {
  item: typeof INFINITE_AVATARS[0];
  index: number;
  scrollX: Animated.Value;
  onPress: () => void;
}

const AvatarCarouselItem = React.memo(function AvatarCarouselItem({
  item,
  index,
  scrollX,
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

  const nameColor = ringOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ['#7A877E', '#0B2B1F'],
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
        {/* Pure circular avatar container (no square card) */}
        <View style={styles.circleContainer}>
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
          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>

      {/* Name below avatar */}
      <Animated.Text
        style={[
          styles.avatarNameText,
          { color: nameColor },
        ]}
        numberOfLines={1}
      >
        {item.name}
      </Animated.Text>
    </Pressable>
  );
});

export function AvatarPickerBottomSheet({
  visible,
  selectedAvatarId,
  onSelect,
  onClose,
}: AvatarPickerBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(() => Dimensions.get('window').width);

  // Exact padding to place active item at dead center
  const sidePadding = Math.max(0, (containerWidth - ITEM_WIDTH) / 2);

  const baseIndex = Math.max(
    0,
    CARTOON_AVATARS.findIndex((a) => a.id === selectedAvatarId)
  );
  const initialLoopedIndex = MIDDLE_SET * CARTOON_AVATARS.length + (baseIndex >= 0 ? baseIndex : 0);

  const [activeIndex, setActiveIndex] = useState(initialLoopedIndex);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const scrollX = useRef(new Animated.Value(initialLoopedIndex * SNAP_INTERVAL)).current;

  // Modal entrance / exit animation
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      const targetBase = Math.max(
        0,
        CARTOON_AVATARS.findIndex((a) => a.id === selectedAvatarId)
      );
      const targetIndex = MIDDLE_SET * CARTOON_AVATARS.length + (targetBase >= 0 ? targetBase : 0);
      setActiveIndex(targetIndex);
      scrollX.setValue(targetIndex * SNAP_INTERVAL);

      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      scrollRef.current?.scrollTo({
        x: targetIndex * SNAP_INTERVAL,
        animated: false,
      });
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
  }, [visible, selectedAvatarId, sheetAnim, scrollX]);

  const handleClose = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsRendered(false);
      onClose();
    });
  };

  const handleConfirm = () => {
    const selected = CARTOON_AVATARS[activeIndex % CARTOON_AVATARS.length] ?? CARTOON_AVATARS[0];
    onSelect(selected.id);
    handleClose();
  };

  const handleScrollUpdate = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const computedIndex = Math.round(offsetX / SNAP_INTERVAL);
    if (computedIndex >= 0 && computedIndex < INFINITE_AVATARS.length && computedIndex !== activeIndex) {
      setActiveIndex(computedIndex);
    }
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / SNAP_INTERVAL);
    // Silent loop reset if user scrolled towards edges of repeated sets
    if (currentIndex < 8 || currentIndex >= 8 * 4) {
      const normalizedIndex = MIDDLE_SET * 8 + (currentIndex % 8);
      const normalizedOffset = normalizedIndex * SNAP_INTERVAL;
      scrollRef.current?.scrollTo({ x: normalizedOffset, animated: false });
      scrollX.setValue(normalizedOffset);
      setActiveIndex(normalizedIndex);
    }
  };

  const scrollToItem = (index: number) => {
    setActiveIndex(index);
    scrollRef.current?.scrollTo({
      x: index * SNAP_INTERVAL,
      animated: true,
    });
  };

  if (!isRendered) return null;

  const activeAvatar = CARTOON_AVATARS[activeIndex % CARTOON_AVATARS.length] ?? CARTOON_AVATARS[0];

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
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Slide-up Sheet */}
        <Animated.View
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
            <Text style={styles.sheetTitle}>Choose your avatar</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close avatar picker"
              hitSlop={10}
              onPress={handleClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color="#0B2B1F" />
            </Pressable>
          </View>

          {/* Smooth Infinite Horizontal Carousel */}
          <View
            style={styles.carouselContainer}
            onLayout={(e) => {
              const width = e.nativeEvent.layout.width;
              if (width > 0 && Math.abs(width - containerWidth) > 1) {
                setContainerWidth(width);
              }
            }}
          >
            <Animated.ScrollView
              ref={scrollRef as any}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: initialLoopedIndex * SNAP_INTERVAL, y: 0 }}
              contentContainerStyle={{ paddingHorizontal: sidePadding }}
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="start"
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true, listener: handleScrollUpdate }
              )}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              keyboardShouldPersistTaps="always"
            >
              {INFINITE_AVATARS.map((item, index) => (
                <AvatarCarouselItem
                  key={item.key}
                  item={item}
                  index={index}
                  scrollX={scrollX}
                  onPress={() => scrollToItem(index)}
                />
              ))}
            </Animated.ScrollView>
          </View>

          {/* Confirm Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Set ${activeAvatar.name} as profile avatar`}
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.selectButton,
              pressed && styles.selectButtonPressed,
            ]}
          >
            <Text style={styles.selectButtonText}>
              Set as profile avatar
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
    backgroundColor: 'rgba(11, 43, 31, 0.48)',
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: '#F4F3EC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2B1F',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  sheetHandle: {
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#D2D9CE',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sheetTitle: {
    color: '#0B2B1F',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselContainer: {
    height: 156,
    justifyContent: 'center',
    marginHorizontal: -20, // Bleed full-width across the sheet for edge-to-edge carousel
  },
  itemColumn: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    borderRadius: 41,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0B2B1F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  activeRing: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#0B2B1F',
  },
  checkBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0B2B1F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarNameText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
    textAlign: 'center',
  },
  selectButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0B3D2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  selectButtonPressed: {
    opacity: 0.9,
  },
  selectButtonText: {
    color: '#F4F3EC',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
});
