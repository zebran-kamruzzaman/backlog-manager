// src/renderer/components/HeroItem.tsx
import type { BacklogItem } from '../../shared/types';
import { decodeCuisineIcon } from '../../shared/cuisineIcons';

interface Props {
  item          : BacklogItem;
  onToggleLogged: (id: number) => void;
  onRemove      : (id: number) => void;
  isDraggable   : boolean;
}

export function HeroItem({ item, onToggleLogged, onRemove, isDraggable }: Props) {
  const cuisineIcon = decodeCuisineIcon(item.heroImageUrl);
  const isRestaurant = cuisineIcon !== null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-3 group" style={{ height: 340 }}>
      {/* Background */}
      {isRestaurant ? (
        // Cuisine icon hero
        <div className="absolute inset-0 bg-linear-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
          <span className="text-[140px] opacity-20 select-none">{cuisineIcon}</span>
        </div>
      ) : item.heroImageUrl ? (
        <img
          src={item.heroImageUrl}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          draggable={false}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-indigo-900/60 to-[#1a1a1a]" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

      {/* Drag handle */}
      {isDraggable && (
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripIcon />
        </div>
      )}

      {/* Priority badge */}
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-indigo-500/80 text-xs font-bold backdrop-blur-sm">
        #1
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-4">
        <div className="flex items-end gap-4 min-w-0">
          {/* Thumbnail / cuisine icon */}
          <div className="w-16 h-24 rounded-lg shadow-xl shrink-0 ring-1 ring-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
            {isRestaurant ? (
              <span className="text-4xl">{cuisineIcon}</span>
            ) : item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
          </div>

          <div className="min-w-0">
            <h2 className="text-2xl font-bold leading-tight tracking-tight truncate">{item.title}</h2>
            <div className="flex items-center gap-3 mt-1.5">
              {item.releaseYear && <span className="text-sm text-white/60">{item.releaseYear}</span>}
              {item.rating != null && (
                <span className="flex items-center gap-1 text-sm text-amber-400">
                  ★ {item.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggleLogged(item.id)}
            className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold transition-colors"
          >
            Mark Logged ✓
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-red-500/30 text-sm transition-colors opacity-0 group-hover:opacity-100"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

function GripIcon() {
  return (
    <div className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="white" opacity="0.7">
        <circle cx="4" cy="3" r="1.2"/><circle cx="10" cy="3" r="1.2"/>
        <circle cx="4" cy="7" r="1.2"/><circle cx="10" cy="7" r="1.2"/>
        <circle cx="4" cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
      </svg>
    </div>
  );
}