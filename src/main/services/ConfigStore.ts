// ============================================================
//  src/main/services/ConfigStore.ts
//
//  Persists API keys to disk, encrypted via Electron's safeStorage
//  (OS keychain / DPAPI / libsecret depending on platform).
//
//  Falls back to process.env so existing .env files still work
//  during development when safeStorage is unavailable.
// ============================================================

import { app, safeStorage } from 'electron';
import path from 'node:path';
import fs   from 'node:fs';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface ApiKeys {
  tmdbApiKey       : string;
  igdbClientId     : string;
  igdbAccessToken  : string;
  googlePlacesKey  : string;
}

const EMPTY_KEYS: ApiKeys = {
  tmdbApiKey      : '',
  igdbClientId    : '',
  igdbAccessToken : '',
  googlePlacesKey : '',
};

// ------------------------------------------------------------------
// Storage path
// ------------------------------------------------------------------

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'api-keys.enc');
}

// ------------------------------------------------------------------
// Encrypt / Decrypt helpers
// ------------------------------------------------------------------

function canEncrypt(): boolean {
  return safeStorage.isEncryptionAvailable();
}

function encrypt(value: string): string {
  if (!value) return '';
  if (!canEncrypt()) return value; // dev fallback — store plaintext
  return safeStorage.encryptString(value).toString('base64');
}

function decrypt(value: string): string {
  if (!value) return '';
  if (!canEncrypt()) return value;
  try {
    return safeStorage.decryptString(Buffer.from(value, 'base64'));
  } catch {
    return ''; // corrupted or wrong machine — treat as empty
  }
}

// ------------------------------------------------------------------
// Read / Write
// ------------------------------------------------------------------

interface StoredPayload {
  tmdbApiKey      : string;
  igdbClientId    : string;
  igdbAccessToken : string;
  googlePlacesKey : string;
  encrypted       : boolean;
}

export function readKeys(): ApiKeys {
  try {
    const raw     = fs.readFileSync(getConfigPath(), 'utf-8');
    const payload = JSON.parse(raw) as StoredPayload;

    if (payload.encrypted) {
      return {
        tmdbApiKey      : decrypt(payload.tmdbApiKey),
        igdbClientId    : decrypt(payload.igdbClientId),
        igdbAccessToken : decrypt(payload.igdbAccessToken),
        googlePlacesKey : decrypt(payload.googlePlacesKey),
      };
    }
    // Legacy unencrypted file
    return {
      tmdbApiKey      : payload.tmdbApiKey      || '',
      igdbClientId    : payload.igdbClientId    || '',
      igdbAccessToken : payload.igdbAccessToken || '',
      googlePlacesKey : payload.googlePlacesKey || '',
    };
  } catch {
    // File doesn't exist yet — fall back to process.env (.env file)
    return {
      tmdbApiKey      : process.env.TMDB_API_KEY        ?? '',
      igdbClientId    : process.env.IGDB_CLIENT_ID       ?? '',
      igdbAccessToken : process.env.IGDB_ACCESS_TOKEN    ?? '',
      googlePlacesKey : process.env.GOOGLE_PLACES_KEY    ?? '',
    };
  }
}

export function writeKeys(keys: ApiKeys): void {
  const payload: StoredPayload = {
    tmdbApiKey      : encrypt(keys.tmdbApiKey),
    igdbClientId    : encrypt(keys.igdbClientId),
    igdbAccessToken : encrypt(keys.igdbAccessToken),
    googlePlacesKey : encrypt(keys.googlePlacesKey),
    encrypted       : canEncrypt(),
  };
  fs.writeFileSync(getConfigPath(), JSON.stringify(payload, null, 2), 'utf-8');
}

// ------------------------------------------------------------------
// Masked helper for safe display in the UI
// Shows:  "sk-••••••••3f9a"  (first 0 + last 4 chars)
// ------------------------------------------------------------------
export function maskKey(key: string): string {
  if (!key || key.length < 6) return key ? '••••••••' : '';
  return '••••••••' + key.slice(-4);
}