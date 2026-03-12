import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'search_history_v1';
const MAX_ITEMS = 10;

async function readRaw(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function getSearchHistory(): Promise<string[]> {
  return readRaw();
}

export async function addSearchTerm(term: string): Promise<string[]> {
  const normalized = term.trim();
  if (!normalized) return getSearchHistory();

  const current = await readRaw();
  const withoutDup = current.filter((t) => t.toLowerCase() !== normalized.toLowerCase());
  const next = [normalized, ...withoutDup].slice(0, MAX_ITEMS);

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }

  return next;
}

export async function clearSearchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

