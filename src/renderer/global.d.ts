// src/renderer/global.d.ts
import type { BacklogAPI, SettingsAPI } from '../shared/types';
declare global {
  interface Window {
    backlogAPI : BacklogAPI;
    settingsAPI: SettingsAPI;
    shellAPI   : { openExternal: (url: string) => Promise<void> };
  }
}
export {};