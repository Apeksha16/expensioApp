import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  findNodeHandle,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing } from '../theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeightRatio?: number;
  fixedHeightRatio?: number;
  accessibilityLabel?: string;
  returnFocusRef?: React.RefObject<any>;
  contentStyle?: ViewStyle;
}

const DISMISS_THRESHOLD = 90;

export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.9,
  fixedHeightRatio,
  accessibilityLabel = 'Dialog',
  returnFocusRef,
  contentStyle,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [rendered, setRendered] = useState(visible);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const translateY = useRef(new Animated.Value(windowHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetRef = useRef<React.ComponentRef<typeof View>>(null);
  const dismissingRef = useRef(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(Boolean(enabled));
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
      if (mounted) setReduceMotion(Boolean(enabled));
    });
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  const restoreFocus = useCallback(() => {
    if (returnFocusRef?.current) {
      const node = findNodeHandle(returnFocusRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, [returnFocusRef]);

  const animateClose = useCallback(
    (notifyClose: boolean) => {
      if (dismissingRef.current) return;
      dismissingRef.current = true;
      const duration = reduceMotion ? 0 : 210;
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: windowHeight,
          duration,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        dismissingRef.current = false;
        setRendered(false);
        restoreFocus();
        if (notifyClose) onClose();
      });
    },
    [onClose, overlayOpacity, reduceMotion, restoreFocus, translateY, windowHeight],
  );

  useEffect(() => {
    if (visible) {
      dismissingRef.current = false;
      setRendered(true);
      translateY.setValue(reduceMotion ? 0 : windowHeight);
      overlayOpacity.setValue(reduceMotion ? 1 : 0);

      if (!reduceMotion) {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }

      const focusTimer = setTimeout(() => {
        const node = findNodeHandle(sheetRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 150);

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        animateClose(true);
        return true;
      });

      return () => {
        clearTimeout(focusTimer);
        backHandler.remove();
      };
    } else if (rendered) {
      animateClose(false);
    }
  }, [visible, reduceMotion, windowHeight]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.9) {
            animateClose(true);
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 4,
            }).start();
          }
        },
      }),
    [animateClose, translateY],
  );

  if (!rendered) return null;

  const availableHeight = Math.max(260, windowHeight - insets.top - spacing.sm - keyboardHeight);
  const resolvedFixedHeight = fixedHeightRatio
    ? Math.min(windowHeight * fixedHeightRatio, 640, availableHeight)
    : undefined;
  const resolvedMaxHeight = Math.min(windowHeight * maxHeightRatio, availableHeight);

  return (
    <Modal
      transparent
      visible={rendered}
      animationType="none"
      onRequestClose={() => animateClose(true)}
      statusBarTranslucent
    >
      <View
        style={[
          styles.keyboardWrap,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: keyboardHeight,
          },
        ]}
      >
        <Animated.View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.backdrop, { opacity: overlayOpacity }]}
        >
          <Pressable
            accessible={false}
            importantForAccessibility="no"
            style={StyleSheet.absoluteFill}
            onPress={() => animateClose(true)}
          />
        </Animated.View>

        <Animated.View
          ref={sheetRef}
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel}
          style={[
            styles.sheet,
            {
              maxHeight: resolvedMaxHeight,
              ...(resolvedFixedHeight ? { height: resolvedFixedHeight } : {}),
              paddingBottom: keyboardHeight > 0 ? spacing.md : Math.max(insets.bottom, spacing.md),
              transform: [{ translateY }],
            },
            contentStyle,
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.handleZone}>
            <View style={styles.handle} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    ...shadows.card,
  },
  handleZone: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
});
