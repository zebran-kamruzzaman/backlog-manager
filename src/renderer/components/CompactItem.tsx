// src/renderer/components/CompactItem.tsx
import type { BacklogItem } from '../../shared/types';
import { decodeCuisineIcon } from '../../shared/cuisineIcons';

interface Props {
  item          : BacklogItem;
  onToggleLogged: (id: number) => void;
  onRemove      : (id: number) => void;
  isDraggable   : boolean;
  isLogged      ?: boolean;
}

export function CompactItem({ item, onToggleLogged, onRemove, isDraggable, isLogged }: Props) {
  const cuisineIcon = decodeCuisineIcon(item.thumbnailUrl);
  return (
    <div
      className={`
        group flex items-center gap-3 px-3 py-2.5 rounded-xl
        border border-transparent hover:border-white/10
        hover:bg-white/4 transition-all duration-150
        ${isLogged ? 'opacity-50' : ''}
      `}
    >
      {/* Drag grip */}
      {isDraggable && (
        <div className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab">
          <GripIcon />
        </div>
      )}
      {!isDraggable && <div className="w-4 shrink-0" />}

      {/* Thumbnail */}
      <div className="w-10 h-14 shrink-0 rounded-md overflow-hidden bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
        {cuisineIcon ? (
          <span className="text-2xl">{cuisineIcon}</span>
        ) : item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-linear-to-b from-indigo-900/30 to-black/30" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isLogged ? 'line-through text-white/40' : 'text-white/90'}`}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.releaseYear && (
            <span className="text-xs text-white/30">{item.releaseYear}</span>
          )}
          {item.rating != null && (
            <span className="text-xs text-amber-400/70">★ {item.rating.toFixed(1)}</span>
          )}
        </div>
      </div>

      {/* Actions — appear on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onToggleLogged(item.id)}
          title={isLogged ? 'Unlog' : 'Mark logged'}
          className={`
            w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors
            ${isLogged
              ? 'bg-white/10 hover:bg-white/20 text-white/50'
              : 'bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300'}
          `}
        >
          {isLogged ? '↩' : '✓'}
        </button>
        <button
          onClick={() => onRemove(item.id)}
          title="Remove"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-white/5 hover:bg-red-500/30 text-white/30 hover:text-red-300 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-white">
      <circle cx="3" cy="2"  r="1"/><circle cx="9" cy="2"  r="1"/>
      <circle cx="3" cy="6"  r="1"/><circle cx="9" cy="6"  r="1"/>
      <circle cx="3" cy="10" r="1"/><circle cx="9" cy="10" r="1"/>
    </svg>
  );
}