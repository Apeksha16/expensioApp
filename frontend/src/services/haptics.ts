import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const haptics = {
  /**
   * Subtle light tap for button presses and tab clicks.
   */
  async light(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // safe fallback on unsupported hardware
    }
  },

  /**
   * Medium impact for card interactions and account switches.
   */
  async medium(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // safe fallback
    }
  },

  /**
   * Prominent heavy impact for sheet triggers or swipe thresholds.
   */
  async heavy(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // safe fallback
    }
  },

  /**
   * Success vibration pattern for recording expenses or settling debts.
   */
  async success(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // safe fallback
    }
  },

  /**
   * Warning vibration pattern for budget threshold warnings.
   */
  async warning(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // safe fallback
    }
  },

  /**
   * Error vibration pattern for invalid inputs or failed auth.
   */
  async error(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // safe fallback
    }
  },

  /**
   * Crisp selection tick for category pickers and segment switches.
   */
  async selection(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // safe fallback
    }
  },
};
