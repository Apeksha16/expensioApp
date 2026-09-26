import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricStatus {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: 'FaceID' | 'TouchID' | 'Fingerprint' | 'Biometrics' | 'None';
}

export const biometrics = {
  /**
   * Checks whether the device hardware supports biometrics and has enrolled records.
   */
  async checkAvailability(): Promise<BiometricStatus> {
    if (Platform.OS === 'web') {
      return {
        isAvailable: false,
        hasHardware: false,
        isEnrolled: false,
        biometricType: 'None',
      };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: BiometricStatus['biometricType'] = 'Biometrics';
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = Platform.OS === 'ios' ? 'FaceID' : 'Biometrics';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = Platform.OS === 'ios' ? 'TouchID' : 'Fingerprint';
      }

      return {
        isAvailable: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        biometricType,
      };
    } catch (e) {
      console.warn('[Biometrics] Error checking availability:', e);
      return {
        isAvailable: false,
        hasHardware: false,
        isEnrolled: false,
        biometricType: 'None',
      };
    }
  },

  /**
   * Prompts the native FaceID / TouchID / Android Biometrics modal.
   */
  async authenticate(promptMessage: string = 'Unlock Expensio'): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true; // Auto-pass on web preview
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use OTP instead',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (e) {
      console.warn('[Biometrics] Authentication error:', e);
      return false;
    }
  },
};
