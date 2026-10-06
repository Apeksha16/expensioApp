import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  DB_VERSION: '@expensio_db_version',
  AUTH_USER: '@expensio_auth_user',
  EXPENSES: '@expensio_expenses_cache',
  SPLITS: '@expensio_splits_cache',
  SUBSCRIPTIONS: '@expensio_subscriptions_cache',
  ACCOUNTS: '@expensio_accounts_cache',
  PAYMENTS: '@expensio_payments_cache',
} as const;

export const CURRENT_DB_VERSION = 1;

// In-memory memory map for reliable fallback
const memoryMap = new Map<string, string>();

export const storage = {
  /**
   * Reads and parses a JSON object from local storage.
   */
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data !== null) {
        return JSON.parse(data) as T;
      }
    } catch {
      // Use in-memory fallback
    }

    if (memoryMap.has(key)) {
      try {
        return JSON.parse(memoryMap.get(key)!) as T;
      } catch {
        return fallback;
      }
    }

    return fallback;
  },

  /**
   * Serializes and writes a JSON object to local storage.
   */
  async set<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    memoryMap.set(key, serialized);
    try {
      await AsyncStorage.setItem(key, serialized);
    } catch {
      // Stored in memoryMap
    }
  },

  /**
   * Removes a key from local storage.
   */
  async remove(key: string): Promise<void> {
    memoryMap.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Removed from memoryMap
    }
  },

  /**
   * Clears all app storage (e.g. on logout).
   */
  async clearAll(): Promise<void> {
    memoryMap.clear();
    try {
      await AsyncStorage.clear();
    } catch {
      // Cleared memoryMap
    }
  },

  /**
   * Initializes database and handles schema migrations.
   */
  async initDb(): Promise<void> {
    const version = await this.get<number>(STORAGE_KEYS.DB_VERSION, 0);
    if (version < CURRENT_DB_VERSION) {
      console.log(`Migrating DB from version ${version} to ${CURRENT_DB_VERSION}`);
      // Future migration logic goes here
      // if (version === 1) { ... migrate to 2 ... }
      await this.set(STORAGE_KEYS.DB_VERSION, CURRENT_DB_VERSION);
    }
  }
};
