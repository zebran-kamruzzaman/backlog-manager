// ============================================================
//  src/main/ipc/settingsHandlers.ts
//  Import this in main.ts alongside handlers.ts
// ============================================================

import { ipcMain }            from 'electron';
import { readKeys, writeKeys, maskKey } from '../services/ConfigStore';
import type { ApiKeys }       from '../services/ConfigStore';
import type { IpcResponse }   from '../../shared/types';

const SETTINGS_IPC = {
  GET_KEYS : 'settings:get-keys',
  SET_KEYS : 'settings:set-keys',
} as const;

// Export so preload can reference the same constants
export { SETTINGS_IPC };

function handle<T>(channel: string, fn: (...a: unknown[]) => T | Promise<T>) {
  ipcMain.handle(channel, async (_e, ...args): Promise<IpcResponse<T>> => {
    try {
      return { success: true, data: await fn(...args) };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
}

// Returns keys with values masked — the renderer never sees raw secrets
handle(SETTINGS_IPC.GET_KEYS, () => {
  const keys = readKeys();
  return {
    tmdbApiKey      : maskKey(keys.tmdbApiKey),
    igdbClientId    : maskKey(keys.igdbClientId),
    igdbAccessToken : maskKey(keys.igdbAccessToken),
    googlePlacesKey : maskKey(keys.googlePlacesKey),
    // Booleans so the UI can show "configured ✓" without seeing the value
    hasTmdb         : keys.tmdbApiKey.length       > 0,
    hasIgdb         : keys.igdbClientId.length     > 0 && keys.igdbAccessToken.length > 0,
    hasPlaces       : keys.googlePlacesKey.length  > 0,
  };
});

// Accepts partial updates — empty string means "don't overwrite existing key"
handle(SETTINGS_IPC.SET_KEYS, (incoming: unknown) => {
  const patch   = incoming as Partial<ApiKeys>;
  const current = readKeys();

  writeKeys({
    tmdbApiKey      : patch.tmdbApiKey      || current.tmdbApiKey,
    igdbClientId    : patch.igdbClientId    || current.igdbClientId,
    igdbAccessToken : patch.igdbAccessToken || current.igdbAccessToken,
    googlePlacesKey : patch.googlePlacesKey || current.googlePlacesKey,
  });
});