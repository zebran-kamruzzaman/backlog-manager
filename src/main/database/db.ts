// ============================================================
//  BACKLOG MANAGER — Database Module (Main Process only)
//  Uses better-sqlite3 (synchronous — no async overhead needed)
// ============================================================

import Database from 'better-sqlite3';
import { app }  from 'electron';
import path     from 'node:path';
import type { BacklogItem, Category, SortMode } from '../../shared/types';

// ------------------------------------------------------------------
// 1. CONNECTION
// ------------------------------------------------------------------

// Schema inlined — no file I/O needed after webpack bundles
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS backlog_items (
    id                 INTEGER  PRIMARY KEY AUTOINCREMENT,
    external_id        TEXT     NOT NULL,
    category           TEXT     NOT NULL CHECK(category IN ('movies','tv','anime','games','restaurants')),
    title              TEXT     NOT NULL,
    hero_image_url     TEXT     NOT NULL DEFAULT '',
    thumbnail_url      TEXT     NOT NULL DEFAULT '',
    release_year       INTEGER,
    rating             REAL,
    is_logged          INTEGER  NOT NULL DEFAULT 0 CHECK(is_logged IN (0,1)),
    custom_order_index INTEGER  NOT NULL DEFAULT 0,
    created_at         TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    notes              TEXT,
    UNIQUE(external_id, category)
  );

  CREATE TABLE IF NOT EXISTS sort_preferences (
    category  TEXT PRIMARY KEY CHECK(category IN ('movies','tv','anime','games','restaurants')),
    sort_mode TEXT NOT NULL DEFAULT 'custom_priority'
              CHECK(sort_mode IN ('alphabetical','chronological','custom_priority','bespoke'))
  );

  INSERT OR IGNORE INTO sort_preferences (category, sort_mode) VALUES
    ('movies','custom_priority'),('tv','custom_priority'),
    ('anime','custom_priority'),('games','custom_priority'),
    ('restaurants','custom_priority');

  CREATE INDEX IF NOT EXISTS idx_items_category       ON backlog_items(category);
  CREATE INDEX IF NOT EXISTS idx_items_category_order ON backlog_items(category, custom_order_index);
  CREATE INDEX IF NOT EXISTS idx_items_logged         ON backlog_items(category, is_logged);
`;

function getDbPath(): string {
  if (app.isPackaged) return path.join(app.getPath('userData'), 'backlog.db');
  return path.join(app.getPath('userData'), 'backlog-dev.db');
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(getDbPath());
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL');
  _db.exec(SCHEMA);
  return _db;
}

export function closeDb(): void { _db?.close(); _db = null; }

// ------------------------------------------------------------------
// 2. ROW MAPPER
// ------------------------------------------------------------------

interface ItemRow {
  id                : number;
  external_id       : string;
  category          : string;
  title             : string;
  hero_image_url    : string;
  thumbnail_url     : string;
  release_year      : number | null;
  rating            : number | null;
  is_logged         : number;
  custom_order_index: number;
  created_at        : string;
  notes             : string | null;
}

export function rowToItem(row: ItemRow): BacklogItem {
  return {
    id              : row.id,
    externalId      : row.external_id,
    category        : row.category as Category,
    title           : row.title,
    heroImageUrl    : row.hero_image_url,
    thumbnailUrl    : row.thumbnail_url,
    releaseYear     : row.release_year,
    rating          : row.rating,
    isLogged        : row.is_logged === 1,
    customOrderIndex: row.custom_order_index,
    createdAt       : row.created_at,
    notes           : row.notes,
  };
}

// ------------------------------------------------------------------
// 3. QUERY HELPERS
// ------------------------------------------------------------------

export function dbInsertItem(
  item: Omit<BacklogItem, 'id' | 'isLogged' | 'customOrderIndex' | 'createdAt'>
): BacklogItem {
  const db = getDb();
  const maxRow = db
    .prepare<[string], { max_idx: number | null }>(
      'SELECT MAX(custom_order_index) AS max_idx FROM backlog_items WHERE category = ?'
    )
    .get(item.category);

  const nextIndex = (maxRow?.max_idx ?? -1) + 1;

  const result = db.prepare(`
    INSERT INTO backlog_items
      (external_id, category, title, hero_image_url, thumbnail_url,
       release_year, rating, is_logged, custom_order_index, notes)
    VALUES
      (@externalId, @category, @title, @heroImageUrl, @thumbnailUrl,
       @releaseYear, @rating, 0, @customOrderIndex, @notes)
  `).run({
    externalId: item.externalId, category: item.category,
    title: item.title, heroImageUrl: item.heroImageUrl,
    thumbnailUrl: item.thumbnailUrl, releaseYear: item.releaseYear ?? null,
    rating: item.rating ?? null, customOrderIndex: nextIndex,
    notes: item.notes ?? null,
  });

  return dbGetItemById(result.lastInsertRowid as number)!;
}

export function dbGetItemById(id: number): BacklogItem | null {
  const row = getDb()
    .prepare<[number], ItemRow>('SELECT * FROM backlog_items WHERE id = ?')
    .get(id);
  return row ? rowToItem(row) : null;
}

export function dbGetItemsByCategory(category: Category): BacklogItem[] {
  return getDb()
    .prepare<[string], ItemRow>('SELECT * FROM backlog_items WHERE category = ?')
    .all(category)
    .map(rowToItem);
}

export function dbToggleLogged(id: number): BacklogItem | null {
  getDb().prepare(`
    UPDATE backlog_items
       SET is_logged = CASE WHEN is_logged = 1 THEN 0 ELSE 1 END
     WHERE id = ?
  `).run(id);
  return dbGetItemById(id);
}

export function dbUpdateNotes(id: number, notes: string): BacklogItem | null {
  getDb().prepare('UPDATE backlog_items SET notes = ? WHERE id = ?').run(notes, id);
  return dbGetItemById(id);
}

export function dbDeleteItem(id: number): void {
  getDb().prepare('DELETE FROM backlog_items WHERE id = ?').run(id);
}

/**
 * Reorder items in a category.
 * Writes new customOrderIndex values for each ID in a single transaction.
 * Also triggers snapback by letting the caller set sort mode to custom_priority.
 */
export function dbReorder(category: Category, orderedIds: number[]): void {
  const db   = getDb();
  const stmt = db.prepare(
    'UPDATE backlog_items SET custom_order_index = ? WHERE id = ? AND category = ?'
  );
  db.transaction((ids: number[]) => {
    ids.forEach((id, index) => stmt.run(index, id, category));
  })(orderedIds);
}

// ------------------------------------------------------------------
// 4. SORT PREFERENCE HELPERS
// ------------------------------------------------------------------

export function dbGetSortMode(category: Category): SortMode {
  const row = getDb()
    .prepare<[string], { sort_mode: string }>(
      'SELECT sort_mode FROM sort_preferences WHERE category = ?'
    )
    .get(category);
  return (row?.sort_mode ?? 'custom_priority') as SortMode;
}

export function dbSetSortMode(category: Category, mode: SortMode): void {
  getDb()
    .prepare('UPDATE sort_preferences SET sort_mode = ? WHERE category = ?')
    .run(mode, category);
}
