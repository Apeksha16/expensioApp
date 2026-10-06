import React, { useRef, useState } from 'react';
import {
  View,
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  editColor?: string;
  deleteColor?: string;
}

const ACTION_WIDTH = 80;

export function SwipeableRow({
  children,
  onEdit,
  onDelete,
  editColor = '#00D1B2',
  deleteColor = '#FF4D4D',
}: SwipeableRowProps) {
  const pan = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        let newDx = gestureState.dx;
        
        if (!onDelete && newDx < 0) newDx = 0;
        if (!onEdit && newDx > 0) newDx = 0;

        if (newDx > ACTION_WIDTH) {
          newDx = ACTION_WIDTH + (newDx - ACTION_WIDTH) * 0.2;
        } else if (newDx < -ACTION_WIDTH) {
          newDx = -ACTION_WIDTH + (newDx + ACTION_WIDTH) * 0.2;
        }

        pan.setValue(newDx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > ACTION_WIDTH * 0.5 && onEdit) {
          Animated.spring(pan, {
            toValue: ACTION_WIDTH,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
          setIsOpen(true);
        } else if (gestureState.dx < -ACTION_WIDTH * 0.5 && onDelete) {
          Animated.spring(pan, {
            toValue: -ACTION_WIDTH,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
          setIsOpen(true);
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
          setIsOpen(false);
        }
      },
    })
  ).current;

  const handleEdit = () => {
    Animated.spring(pan, { toValue: 0, useNativeDriver: false }).start();
    if (onEdit) onEdit();
  };

  const handleDelete = () => {
    Animated.spring(pan, { toValue: 0, useNativeDriver: false }).start();
    if (onDelete) onDelete();
  };

  const editOpacity = pan.interpolate({
    inputRange: [0, ACTION_WIDTH],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const deleteOpacity = pan.interpolate({
    inputRange: [-ACTION_WIDTH, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        {onEdit && (
          <Animated.View style={[styles.actionLeft, { opacity: editOpacity, backgroundColor: editColor }]}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleEdit}>
              <Feather name="edit-2" size={20} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {onDelete && (
          <Animated.View style={[styles.actionRight, { opacity: deleteOpacity, backgroundColor: deleteColor }]}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
              <Feather name="trash-2" size={20} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      <Animated.View
        style={[styles.foregroundContainer, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionLeft: {
    height: '100%',
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  actionRight: {
    height: '100%',
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  actionBtn: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foregroundContainer: {
    width: '100%',
    backgroundColor: 'transparent',
  },
});
