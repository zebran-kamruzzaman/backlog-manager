// ============================================================
//  BACKLOG MANAGER — Shared Types & Interfaces
//  Used by both Main Process and Renderer (via preload bridge)
// ============================================================

// ------------------------------------------------------------------
// 1. ENUMS
// ------------------------------------------------------------------

export enum Category {
  Movies      = 'movies',
  TV          = 'tv',
  Anime       = 'anime',
  Games       = 'games',
  Restaurants = 'restaurants',
}

export enum SortMode {
  Alphabetical   = 'alphabetical',
  Chronological  = 'chronological',
  CustomPriority = 'custom_priority',
  Bespoke        = 'bespoke',
}

// ------------------------------------------------------------------
// 2. CORE DATA MODEL
// ------------------------------------------------------------------

/**
 * BacklogItem — the canonical shape for every item in the database.
 * `customOrderIndex` drives manual priority ordering.
 * `isLogged` moves an item to the "completed" section.
 */
export interface BacklogItem {
  id              : number;        // SQLite auto-increment PK
  externalId      : string;        // ID from external API
  category        : Category;
  title           : string;
  heroImageUrl    : string;        // Large landscape/poster image
  thumbnailUrl    : string;        // Small square thumbnail
  releaseYear     : number | null; // Used for Chronological sort
  rating          : number | null; // 0–10, used for Bespoke algorithm
  isLogged        : boolean;       // true = completed / visited
  customOrderIndex: number;        // Lower number = higher priority
  createdAt       : string;        // ISO 8601 timestamp
  notes           : string | null; // Optional personal notes
}

// ------------------------------------------------------------------
// 3. API / IPC PAYLOADS
// ------------------------------------------------------------------

/** Lightweight result returned by a search — not yet persisted. */
export interface SearchResult {
  externalId  : string;
  category    : Category;
  title       : string;
  heroImageUrl: string;
  thumbnailUrl: string;
  releaseYear : number | null;
  rating      : number | null;
}

/** Payload when adding a SearchResult to the backlog. */
export type AddItemPayload = Omit<
  BacklogItem,
  'id' | 'isLogged' | 'customOrderIndex' | 'createdAt'
>;

/** Payload after a drag-and-drop reorder. */
export interface ReorderPayload {
  category  : Category;
  /** Ordered array of item IDs in their new sequence. */
  orderedIds: number[];
}

/** Generic success/error wrapper returned by every IPC handler. */
export interface IpcResponse<T = void> {
  success: boolean;
  data   ?: T;
  error  ?: string;
}

// ------------------------------------------------------------------
// 4. IPC CHANNEL NAMES  (single source of truth — no magic strings)
// ------------------------------------------------------------------

export const IPC = {
  SEARCH        : 'backlog:search',
  ADD_ITEM      : 'backlog:add-item',
  REMOVE_ITEM   : 'backlog:remove-item',
  TOGGLE_LOGGED : 'backlog:toggle-logged',
  UPDATE_NOTES  : 'backlog:update-notes',
  GET_ITEMS     : 'backlog:get-items',
  REORDER       : 'backlog:reorder',
  GET_SORT_MODE : 'backlog:get-sort-mode',
  SET_SORT_MODE : 'backlog:set-sort-mode',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

// ------------------------------------------------------------------
// 5. CONTEXT BRIDGE INTERFACE
// ------------------------------------------------------------------

/**
 * BacklogAPI — the strict contract between Renderer and Main Process.
 * Exposed on `window.backlogAPI` via contextBridge in preload.ts.
 * The renderer communicates ONLY through this interface.
 */
export interface BacklogAPI {
  /**
   * Search an external API. Returns ≤20 results — nothing saved yet.
   */
  search(
    category: Category,
    query: string
  ): Promise<IpcResponse<SearchResult[]>>;

  /**
   * Persist a SearchResult to the backlog.
   * Auto-assigns the next `customOrderIndex`.
   */
  addItem(payload: AddItemPayload): Promise<IpcResponse<BacklogItem>>;

  /** Permanently delete an item. */
  removeItem(id: number): Promise<IpcResponse>;

  /** Flip the `isLogged` flag for one item. */
  toggleLogged(id: number): Promise<IpcResponse<BacklogItem>>;

  /** Update personal notes for one item. */
  updateNotes(id: number, notes: string): Promise<IpcResponse<BacklogItem>>;

  /**
   * Fetch all items for a category, pre-sorted by the active SortMode.
   * Logged items are always returned last regardless of sort.
   */
  getItems(category: Category): Promise<IpcResponse<BacklogItem[]>>;

  /**
   * Persist a new manual order after drag-and-drop.
   * Triggers "Snapback" — auto-switches sort to CustomPriority.
   */
  reorder(payload: ReorderPayload): Promise<IpcResponse>;

  /** Return the active SortMode for a category. */
  getSortMode(category: Category): Promise<IpcResponse<SortMode>>;

  /** Persist the user's SortMode preference for a category. */
  setSortMode(category: Category, mode: SortMode): Promise<IpcResponse>;
}

export const SETTINGS_IPC = {
  GET_KEYS: 'settings:get-keys',
  SET_KEYS: 'settings:set-keys',
} as const;

export interface ApiKeyStatus {
  tmdbApiKey: string; igdbClientId: string;
  igdbAccessToken: string; googlePlacesKey: string;
  hasTmdb: boolean; hasIgdb: boolean; hasPlaces: boolean;
}

export interface ApiKeyPatch {
  tmdbApiKey?: string; igdbClientId?: string;
  igdbAccessToken?: string; googlePlacesKey?: string;
}

export interface SettingsAPI {
  getKeys(): Promise<IpcResponse<ApiKeyStatus>>;
  setKeys(patch: ApiKeyPatch): Promise<IpcResponse>;
}