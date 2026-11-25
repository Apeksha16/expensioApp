import { AccessibilityInfo, Platform, Vibration } from 'react-native';

let cachedReduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.()
  .then((enabled) => {
    cachedReduceMotion = Boolean(enabled);
  })
  .catch(() => {});

export function triggerSuccessHaptic(): void {
  if (Platform.OS === 'web' || cachedReduceMotion) return;
  try {
    Vibration.vibrate(10);
  } catch {
    // Haptics optional on unsupported devices
  }
}

export function triggerErrorHaptic(): void {
  if (Platform.OS === 'web' || cachedReduceMotion) return;
  try {
    Vibration.vibrate([0, 18, 40, 18]);
  } catch {
    // Haptics optional on unsupported devices
  }
}
