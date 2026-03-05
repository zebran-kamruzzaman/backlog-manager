// src/preload.ts — full replacement
import { contextBridge, ipcRenderer, shell } from 'electron';

const CH = {
  SEARCH       : 'backlog:search',
  ADD_ITEM     : 'backlog:add-item',
  REMOVE_ITEM  : 'backlog:remove-item',
  TOGGLE_LOGGED: 'backlog:toggle-logged',
  UPDATE_NOTES : 'backlog:update-notes',
  GET_ITEMS    : 'backlog:get-items',
  REORDER      : 'backlog:reorder',
  GET_SORT_MODE: 'backlog:get-sort-mode',
  SET_SORT_MODE: 'backlog:set-sort-mode',
} as const;

const SCH = {
  GET_KEYS: 'settings:get-keys',
  SET_KEYS: 'settings:set-keys',
} as const;

async function invoke(channel: string, ...args: unknown[]) {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Backlog API (unchanged)
contextBridge.exposeInMainWorld('backlogAPI', {
  search       : (category: string, query: string) => invoke(CH.SEARCH, category, query),
  addItem      : (payload: unknown)                 => invoke(CH.ADD_ITEM, payload),
  removeItem   : (id: number)                       => invoke(CH.REMOVE_ITEM, id),
  toggleLogged : (id: number)                       => invoke(CH.TOGGLE_LOGGED, id),
  updateNotes  : (id: number, notes: string)        => invoke(CH.UPDATE_NOTES, id, notes),
  getItems     : (category: string)                 => invoke(CH.GET_ITEMS, category),
  reorder      : (payload: unknown)                 => invoke(CH.REORDER, payload),
  getSortMode  : (category: string)                 => invoke(CH.GET_SORT_MODE, category),
  setSortMode  : (category: string, mode: string)   => invoke(CH.SET_SORT_MODE, category, mode),
});

// Settings API (new)
contextBridge.exposeInMainWorld('settingsAPI', {
  getKeys: ()              => invoke(SCH.GET_KEYS),
  setKeys: (patch: unknown) => invoke(SCH.SET_KEYS, patch),
});

// Shell utilities
contextBridge.exposeInMainWorld('shellAPI', {
  openExternal: (url: string) => shell.openExternal(url),
});