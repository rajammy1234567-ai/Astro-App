import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  async set(key, value) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key) {
    await AsyncStorage.removeItem(key);
  },
};