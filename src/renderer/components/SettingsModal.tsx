// src/renderer/components/SettingsModal.tsx
import { useState, useEffect } from 'react';
import type { ApiKeyStatus, ApiKeyPatch } from '../../shared/types';

interface Props {
  onClose: () => void;
}

interface FieldDef {
  key    : keyof ApiKeyPatch;
  label  : string;
  hint   : string;
  docsUrl: string;
}

const FIELDS: FieldDef[] = [
  {
    key    : 'tmdbApiKey',
    label  : 'TMDB API Key',
    hint   : 'Used for Movies & TV. Free at themoviedb.org/settings/api',
    docsUrl: 'https://www.themoviedb.org/settings/api',
  },
  {
    key    : 'igdbClientId',
    label  : 'IGDB Client ID',
    hint   : 'Twitch Developer Console → your app\'s Client ID',
    docsUrl: 'https://dev.twitch.tv/console',
  },
  {
    key    : 'igdbAccessToken',
    label  : 'IGDB Access Token',
    hint   : 'POST to id.twitch.tv/oauth2/token with client_credentials grant',
    docsUrl: 'https://api-docs.igdb.com/#getting-started',
  },
  {
    key    : 'googlePlacesKey',
    label  : 'Google Places API Key',
    hint   : 'Enable Places API in Google Cloud Console',
    docsUrl: 'https://console.cloud.google.com/apis/library/places-backend.googleapis.com',
  },
];

// Which categories each key unlocks
const KEY_BADGES: Record<keyof ApiKeyPatch, string[]> = {
  tmdbApiKey      : ['🎬 Movies', '📺 TV'],
  igdbClientId    : ['🎮 Games'],
  igdbAccessToken : ['🎮 Games'],
  googlePlacesKey : ['🍽️ Restaurants'],
};

export function SettingsModal({ onClose }: Props) {
  const [status,  setStatus]  = useState<ApiKeyStatus | null>(null);
  const [values,  setValues]  = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Load current masked values on mount
  useEffect(() => {
    window.settingsAPI.getKeys().then((res) => {
      if (res.success && res.data) {
        setStatus(res.data);
        // Pre-fill inputs as empty — user types new value to replace
        setValues({ tmdbApiKey: '', igdbClientId: '', igdbAccessToken: '', googlePlacesKey: '' });
      }
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    // Only send fields that have been typed into (non-empty)
    const patch: ApiKeyPatch = {};
    FIELDS.forEach(({ key }) => {
      const v = values[key]?.trim();
      if (v) (patch as Record<string, string>)[key] = v;
    });

    const res = await window.settingsAPI.setKeys(patch);
    setSaving(false);

    if (res.success) {
      setSaved(true);
      // Refresh masked display
      const fresh = await window.settingsAPI.getKeys();
      if (fresh.success && fresh.data) setStatus(fresh.data);
      setValues({ tmdbApiKey: '', igdbClientId: '', igdbAccessToken: '', googlePlacesKey: '' });
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(res.error ?? 'Failed to save keys');
    }
  };

  const toggleVisible = (key: string) =>
    setVisible((v) => ({ ...v, [key]: !v[key] }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-surface-700 rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold">API Keys</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Keys are encrypted and stored locally on this machine.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">

          {/* Jikan notice — no key needed */}
          <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-green-500/10 ring-1 ring-green-500/20">
            <span className="text-green-400 mt-0.5">✓</span>
            <div>
              <p className="text-sm text-green-300 font-medium">⛩️ Anime — No key required</p>
              <p className="text-xs text-green-400/60 mt-0.5">Jikan (MyAnimeList) is a free public API.</p>
            </div>
          </div>

          {FIELDS.map(({ key, label, hint, docsUrl }) => {
            const STATUS_MAP: Record<keyof ApiKeyPatch, { hasKey: keyof ApiKeyStatus; maskedKey: keyof ApiKeyStatus }> = {
                tmdbApiKey      : { hasKey: 'hasTmdb',  maskedKey: 'tmdbApiKey'       },
                igdbClientId    : { hasKey: 'hasIgdb',  maskedKey: 'igdbClientId'     },
                igdbAccessToken : { hasKey: 'hasIgdb',  maskedKey: 'igdbAccessToken'  },
                googlePlacesKey : { hasKey: 'hasPlaces', maskedKey: 'googlePlacesKey' },
            };
            const isSet  = status ? Boolean(status[STATUS_MAP[key].hasKey])   : false;
            const masked = status ? String(status[STATUS_MAP[key].maskedKey])  : '';
            const isVisible = visible[key];

            return (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    {KEY_BADGES[key].map((b) => (
                      <span key={b} className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{b}</span>
                    ))}
                    {isSet
                      ? <span className="text-xs text-green-400">✓ configured</span>
                      : <span className="text-xs text-amber-400/70">not set</span>
                    }
                  </div>
                </div>

                {/* Input row */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 ring-1 ring-white/10 focus-within:ring-indigo-500/50 transition-all">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={values[key] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                      placeholder={masked || `Enter ${label}…`}
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none font-mono"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      onClick={() => toggleVisible(key)}
                      className="text-white/30 hover:text-white/60 text-xs transition-colors shrink-0"
                      tabIndex={-1}
                    >
                      {isVisible ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {/* Hint + docs link */}
                <p className="text-xs text-white/30">
                  {hint}{' '}
                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400/70 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                    onClick={(e) => { e.preventDefault(); window.shellAPI.openExternal(docsUrl); }}
                  >
                    Get key →
                  </a>
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <div className="text-xs text-white/30">
            {saved && <span className="text-green-400 font-medium">✓ Keys saved successfully</span>}
            {error && <span className="text-red-400">{error}</span>}
            {!saved && !error && 'Leave a field blank to keep the existing key.'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-sm font-semibold transition-colors"
            >
              {saving ? 'Saving…' : 'Save Keys'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}