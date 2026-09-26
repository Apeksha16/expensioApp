import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { colors, radius, spacing } from '../theme';
import { haptics } from '../services/haptics';

interface SwipeableRowProps {
  children: React.ReactNode;
  actionText?: string;
  actionColor?: string;
  onAction: () => void;
}

const ACTION_WIDTH = 80;

export function SwipeableRow({
  children,
  actionText = 'Delete',
  actionColor = colors.coral,
  onAction,
}: SwipeableRowProps) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const isTriggered = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swiping to the left (negative dx)
        if (gestureState.dx < 0) {
          const clampedX = Math.max(gestureState.dx, -ACTION_WIDTH * 1.5);
          pan.x.setValue(clampedX);

          if (clampedX < -ACTION_WIDTH && !isTriggered.current) {
            isTriggered.current = true;
            haptics.light();
          } else if (clampedX >= -ACTION_WIDTH) {
            isTriggered.current = false;
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -ACTION_WIDTH * 0.7) {
          // Snap open
          Animated.spring(pan.x, {
            toValue: -ACTION_WIDTH,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap closed
          Animated.spring(pan.x, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleActionPress = () => {
    haptics.heavy();
    Animated.timing(pan.x, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      onAction();
    });
  };

  return (
    <View style={styles.container}>
      {/* Revealed Action Button */}
      <View style={[styles.actionWrapper, { backgroundColor: actionColor }]}>
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={handleActionPress}
        >
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Foreground Card */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  actionWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderRadius: radius.lg,
  },
  actionButton: {
    width: ACTION_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    backgroundColor: colors.surface,
  },
});
