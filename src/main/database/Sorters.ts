// src/main/database/Sorters.ts
import { SortMode, type BacklogItem } from '../../shared/types';

// Logged items always appear AFTER active items regardless of sort mode.
export function sortItems(items: BacklogItem[], mode: SortMode): BacklogItem[] {
  const active = items.filter((i) => !i.isLogged);
  const logged = items.filter((i) =>  i.isLogged);
  return [...applyMode(active, mode), ...applyMode(logged, mode)];
}

function applyMode(items: BacklogItem[], mode: SortMode): BacklogItem[] {
  switch (mode) {
    case SortMode.Alphabetical  : return sortAlphabetical(items);
    case SortMode.Chronological : return sortChronological(items);
    case SortMode.CustomPriority: return sortCustomPriority(items);
    case SortMode.Bespoke       : return sortBespoke(items);
    default                     : return sortCustomPriority(items);
  }
}

// 1. A → Z, locale-aware
function sortAlphabetical(items: BacklogItem[]): BacklogItem[] {
  return [...items].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  );
}

// 2. Oldest → newest; null years sink to bottom
function sortChronological(items: BacklogItem[]): BacklogItem[] {
  return [...items].sort((a, b) => {
    if (a.releaseYear == null && b.releaseYear == null) return 0;
    if (a.releaseYear == null) return 1;
    if (b.releaseYear == null) return -1;
    return a.releaseYear - b.releaseYear;
  });
}

// 3. Manual drag-and-drop order
function sortCustomPriority(items: BacklogItem[]): BacklogItem[] {
  return [...items].sort((a, b) => a.customOrderIndex - b.customOrderIndex);
}

// 4. Bespoke — composite weighted score
//    Rating 40% | Recency 30% | Priority 30%
//    Tune WEIGHTS to taste (must sum to 1.0)
const WEIGHTS = { rating: 0.4, recency: 0.3, priority: 0.3 } as const;

function sortBespoke(items: BacklogItem[]): BacklogItem[] {
  if (items.length === 0) return items;

  const currentYear = new Date().getFullYear();
  const maxIndex    = Math.max(...items.map((i) => i.customOrderIndex), 1);

  return items
    .map((item) => {
      const ratingScore   = item.rating      != null
        ? clamp(item.rating / 10, 0, 1)
        : 0.5;
      const recencyScore  = item.releaseYear != null
        ? clamp((item.releaseYear - 1970) / Math.max(currentYear - 1970, 1), 0, 1)
        : 0.5;
      const priorityScore = clamp(1 - item.customOrderIndex / maxIndex, 0, 1);

      const total =
        ratingScore   * WEIGHTS.rating   +
        recencyScore  * WEIGHTS.recency  +
        priorityScore * WEIGHTS.priority;

      return { item, total };
    })
    .sort((a, b) => b.total - a.total)
    .map((s) => s.item);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

// Used by handlers.ts — avoids magic strings
export const SNAPBACK_MODE = SortMode.CustomPriority;