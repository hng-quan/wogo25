import AsyncStorage from '@react-native-async-storage/async-storage';

export const setItem = async <T>(key: string, value: T) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export async function getItem<T>(key: string): Promise<T | null> {
  const result = await AsyncStorage.getItem(key);
  return result ? JSON.parse(result) : null;
}

export const removeItem = async (key: string) => {
  await AsyncStorage.removeItem(key);
};
