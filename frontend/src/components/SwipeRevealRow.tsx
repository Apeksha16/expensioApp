import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { colors, layout, spacing, typography } from '../theme';

interface SwipeRevealRowProps {
  children: React.ReactNode;
  actionLabel?: string;
  accessibilityActionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
  isOpen?: boolean;
  onSwipeOpen?: () => void;
  onSwipeClose?: () => void;
}

const ACTION_WIDTH = 88;
const MAX_OVERDRAG = 20;

export function SwipeRevealRow({
  children,
  actionLabel = 'Remove',
  accessibilityActionLabel = 'Remove',
  onAction,
  disabled = false,
  isOpen,
  onSwipeOpen,
  onSwipeClose,
}: SwipeRevealRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);
  const dragStartXRef = useRef(0);
  const didActivateRef = useRef(false);

  const snapTo = useCallback(
    (target: number, notify: boolean) => {
      const nextOpen = target !== 0;
      const changed = openRef.current !== nextOpen;
      openRef.current = nextOpen;

      Animated.spring(translateX, {
        toValue: target,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }).start();

      if (notify && changed) {
        if (nextOpen) {
          onSwipeOpen?.();
        } else {
          onSwipeClose?.();
        }
      }
    },
    [onSwipeClose, onSwipeOpen, translateX],
  );

  useEffect(() => {
    if (isOpen === undefined) return;
    if (!isOpen && openRef.current) {
      snapTo(0, false);
    } else if (isOpen && !openRef.current) {
      snapTo(-ACTION_WIDTH, false);
    }
  }, [isOpen, snapTo]);

  const panGesture = usePanGesture({
    enabled: Boolean(onAction) && !disabled,
    runOnJS: true,
    // Deliberately avoid pulling in react-native-reanimated (~1.5 MB native/JS dep);
    // translateX transitions use RN Animated.spring with useNativeDriver: true.
    disableReanimated: true,
    activeOffsetX: [-8, 8],
    failOffsetY: [-10, 10],
    onBegin: () => {
      didActivateRef.current = false;
      translateX.stopAnimation((currentValue) => {
        dragStartXRef.current = currentValue;
      });
    },
    onActivate: () => {
      didActivateRef.current = true;
    },
    onUpdate: (event) => {
      const raw = dragStartXRef.current + event.translationX;
      let next = raw;
      if (raw > 0) {
        next = 0;
      } else if (raw < -ACTION_WIDTH) {
        const overflow = raw + ACTION_WIDTH;
        next = Math.max(-ACTION_WIDTH - MAX_OVERDRAG, -ACTION_WIDTH + overflow * 0.25);
      }
      translateX.setValue(next);
    },
    onDeactivate: (event) => {
      didActivateRef.current = false;
      const current = dragStartXRef.current + event.translationX;
      const shouldOpen = event.velocityX < -350 || current < -ACTION_WIDTH * 0.45;
      snapTo(shouldOpen ? -ACTION_WIDTH : 0, true);
    },
    onFinalize: () => {
      if (didActivateRef.current) {
        didActivateRef.current = false;
        snapTo(openRef.current ? -ACTION_WIDTH : 0, false);
      }
    },
  });

  if (!onAction) {
    return <>{children}</>;
  }

  const trackOpacity = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, -4, 0],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.actionTrack, { opacity: trackOpacity }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityActionLabel}
          disabled={disabled}
          onPress={() => {
            snapTo(0, true);
            onAction();
          }}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionPressed]}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textInverse} />
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.foreground, { transform: [{ translateX }] }]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  actionTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTION_WIDTH,
    backgroundColor: colors.expense,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    width: '100%',
    height: '100%',
    minHeight: layout.rowHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionText: {
    ...typography.micro,
    color: colors.textInverse,
    fontWeight: '700',
  },
  foreground: {
    backgroundColor: colors.surface,
  },
});
