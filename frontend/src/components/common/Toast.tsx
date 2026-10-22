import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { haptics } from '../../services/haptics';

export interface ToastConfig {
  type: 'error' | 'success' | 'info';
  message: string;
  duration?: number;
}

interface ToastProps {
  config: ToastConfig | null;
  onDismiss: () => void;
}

export function Toast({ config, onDismiss }: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!config) return;

    if (config.type === 'error') {
      try { haptics.error(); } catch {}
    } else if (config.type === 'success') {
      try { haptics.success(); } catch {}
    } else {
      try { haptics.selection(); } catch {}
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    const timer = setTimeout(() => {
      handleHide();
    }, config.duration || 4000);

    return () => clearTimeout(timer);
  }, [config]);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!config) return null;

  const isError = config.type === 'error';
  const isSuccess = config.type === 'success';

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.toastCard,
          isError ? styles.errorCard : isSuccess ? styles.successCard : styles.infoCard,
        ]}
        onPress={handleHide}
        activeOpacity={0.9}
      >
        <View
          style={[
            styles.iconCircle,
            isError ? styles.errorIconCircle : isSuccess ? styles.successIconCircle : styles.infoIconCircle,
          ]}
        >
          <Feather
            name={isError ? 'alert-triangle' : isSuccess ? 'check-circle' : 'info'}
            size={16}
            color={isError ? '#EF4444' : isSuccess ? '#10B981' : '#1864FF'}
          />
        </View>

        <Text
          style={[
            styles.messageText,
            isError ? styles.errorText : isSuccess ? styles.successText : styles.infoText,
          ]}
          numberOfLines={3}
        >
          {config.message}
        </Text>

        <TouchableOpacity onPress={handleHide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={16} color="#64748B" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 32,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1.5,
    gap: 12,
  },
  errorCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F8',
  },
  successCard: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  infoCard: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F0F6FF',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconCircle: {
    backgroundColor: '#FEE2E2',
  },
  successIconCircle: {
    backgroundColor: '#DCFCE7',
  },
  infoIconCircle: {
    backgroundColor: '#DBEAFE',
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  errorText: {
    color: '#991B1B',
  },
  successText: {
    color: '#065F46',
  },
  infoText: {
    color: '#1E40AF',
  },
});
