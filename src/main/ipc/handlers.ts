// ============================================================
//  src/main/ipc/handlers.ts
//  Registers every ipcMain.handle() listener.
//  Import this once in main.ts:  import './ipc/handlers';
// ============================================================

import { ipcMain } from 'electron';
import { scan }    from '../services/ScannerService';
import {
  dbInsertItem,
  dbDeleteItem,
  dbGetItemsByCategory,
  dbToggleLogged,
  dbUpdateNotes,
  dbReorder,
  dbGetSortMode,
  dbSetSortMode,
} from '../database/db';
import { sortItems, SNAPBACK_MODE } from '../database/Sorters';
import { IPC }          from '../../shared/types';
import type {
  AddItemPayload,
  ReorderPayload,
  Category,
  SortMode,
  IpcResponse,
} from '../../shared/types';

// ------------------------------------------------------------------
// Utility: wrap every handler body so it always returns IpcResponse
// ------------------------------------------------------------------
function handle<T>(
  channel : string,
  fn      : (...args: unknown[]) => Promise<T> | T
): void {
  ipcMain.handle(channel, async (_event, ...args): Promise<IpcResponse<T>> => {
    try {
      const data = await fn(...args);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[IPC] ${channel} failed:`, message);
      return { success: false, error: message };
    }
  });
}

// ------------------------------------------------------------------
// SEARCH — calls ScannerService, returns SearchResult[]
// ------------------------------------------------------------------
handle(IPC.SEARCH, (category: unknown, query: unknown) => {
  return scan(category as Category, query as string);
});

// ------------------------------------------------------------------
// ADD ITEM — persist a SearchResult to the DB
// ------------------------------------------------------------------
handle(IPC.ADD_ITEM, (payload: unknown) => {
  return dbInsertItem(payload as AddItemPayload);
});

// ------------------------------------------------------------------
// REMOVE ITEM
// ------------------------------------------------------------------
handle(IPC.REMOVE_ITEM, (id: unknown) => {
  dbDeleteItem(id as number);
  // void return — IpcResponse<void>
});

// ------------------------------------------------------------------
// TOGGLE LOGGED
// ------------------------------------------------------------------
handle(IPC.TOGGLE_LOGGED, (id: unknown) => {
  const item = dbToggleLogged(id as number);
  if (!item) throw new Error(`Item ${id} not found`);
  return item;
});

// ------------------------------------------------------------------
// UPDATE NOTES
// ------------------------------------------------------------------
handle(IPC.UPDATE_NOTES, (id: unknown, notes: unknown) => {
  const item = dbUpdateNotes(id as number, notes as string);
  if (!item) throw new Error(`Item ${id} not found`);
  return item;
});

// ------------------------------------------------------------------
// GET ITEMS — fetched + sorted in the backend
// ------------------------------------------------------------------
handle(IPC.GET_ITEMS, (category: unknown) => {
  const cat   = category as Category;
  const items = dbGetItemsByCategory(cat);
  const mode  = dbGetSortMode(cat);
  return sortItems(items, mode);
});

// ------------------------------------------------------------------
// REORDER — drag-and-drop snapback
// Persists new customOrderIndex values AND snaps sort to CustomPriority
// ------------------------------------------------------------------
handle(IPC.REORDER, (payload: unknown) => {
  const { category, orderedIds } = payload as ReorderPayload;
  dbReorder(category, orderedIds);
  dbSetSortMode(category, SNAPBACK_MODE); // ← typed constant, not a magic string
});

// ------------------------------------------------------------------
// GET / SET SORT MODE
// ------------------------------------------------------------------
handle(IPC.GET_SORT_MODE, (category: unknown) => {
  return dbGetSortMode(category as Category);
});

handle(IPC.SET_SORT_MODE, (category: unknown, mode: unknown) => {
  dbSetSortMode(category as Category, mode as SortMode);
});