import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Persists only the refresh token: Entra ID/access tokens can exceed what the keychain accepts per value,
 * and a fresh set is fetched from the refresh token on launch anyway.
 * SecureStore has no web implementation, so web sessions stay in memory.
 */
const REFRESH_TOKEN_KEY = 'nexus.auth.refreshToken';

const supported = Platform.OS !== 'web';

export async function loadRefreshToken(): Promise<string | null> {
  if (!supported) return null;
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveRefreshToken(refreshToken: string | undefined): Promise<void> {
  if (!supported || !refreshToken) return;
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // Not fatal: the session still works, it just won't survive a restart.
  }
}

export async function clearRefreshToken(): Promise<void> {
  if (!supported) return;
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // Nothing stored, or the keychain is unavailable; either way there's nothing to restore.
  }
}
