import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SECURE_KEYS = {
  AUTH_TOKEN: 'expensio_secure_jwt',
  USER_PROFILE: 'expensio_secure_profile',
  MPIN: 'expensio_secure_mpin',
  BIOMETRIC_ENABLED: 'expensio_biometrics_active',
} as const;

// In-memory fallback map for secure keys
const secureMemory = new Map<string, string>();

/**
 * Hardware-backed secure storage using Expo SecureStore (iOS Keychain / Android Keystore).
 * Provides graceful fallback on web environments where Keychain/Keystore is unsupported.
 */
export const secureStore = {
  /**
   * Save a key-value pair into hardware-backed secure storage
   */
  async setItem(key: string, value: string): Promise<void> {
    secureMemory.set(key, value);
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch {
      // Gracefully stored in secureMemory
    }
  },

  /**
   * Retrieve a key from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        const val = await AsyncStorage.getItem(key);
        return val !== null ? val : (secureMemory.get(key) ?? null);
      }
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) return val;
    } catch {
      // Fall through to memory
    }
    return secureMemory.get(key) ?? null;
  },

  /**
   * Remove a key from secure storage
   */
  async deleteItem(key: string): Promise<void> {
    secureMemory.delete(key);
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignored
    }
  },

  /**
   * High-level typed helpers
   */
  async getAuthToken(): Promise<string | null> {
    return await this.getItem(SECURE_KEYS.AUTH_TOKEN);
  },

  async setAuthToken(token: string): Promise<void> {
    await this.setItem(SECURE_KEYS.AUTH_TOKEN, token);
  },

  async removeAuthToken(): Promise<void> {
    await this.deleteItem(SECURE_KEYS.AUTH_TOKEN);
  },

  async getMpin(): Promise<string | null> {
    return await this.getItem(SECURE_KEYS.MPIN);
  },

  async setMpin(mpin: string): Promise<void> {
    await this.setItem(SECURE_KEYS.MPIN, mpin);
  },

  async clearAllAuth(): Promise<void> {
    await this.deleteItem(SECURE_KEYS.AUTH_TOKEN);
    await this.deleteItem(SECURE_KEYS.USER_PROFILE);
    await this.deleteItem(SECURE_KEYS.MPIN);
  },
};
