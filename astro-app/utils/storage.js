import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value == null) return null;
      try {
        return JSON.parse(value);
      } catch {
        // plain string fallback (corrupt / older installs)
        return value;
      }
    } catch {
      return null;
    }
  },

  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('storage.set failed', key, err?.message);
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};