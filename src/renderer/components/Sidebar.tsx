// src/renderer/components/Sidebar.tsx
import { Category } from '../../shared/types';

const ICONS: Record<Category, string> = {
  [Category.Movies]     : '🎬',
  [Category.TV]         : '📺',
  [Category.Anime]      : '⛩️',
  [Category.Games]      : '🎮',
  [Category.Restaurants]: '🍽️',
};

interface Props {
  categories     : Category[];
  labels         : Record<Category, string>;
  active         : Category;
  onSelect       : (c: Category) => void;
  onOpenSettings : () => void;
}

export function Sidebar({ categories, labels, active, onSelect, onOpenSettings }: Props) {
  return (
    <aside className="flex flex-col w-56 shrink-0 bg-surface-800 border-r border-white/5 py-6 px-3">
      {/* Logo */}
      <div className="px-3 mb-6">
        <span className="text-lg font-bold tracking-tight text-white">Backlog</span>
        <span className="text-lg font-bold tracking-tight text-indigo-400">Manager</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {categories.map((cat) => {
          const isActive = cat === active;
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 text-left w-full
                ${isActive
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'}
              `}
            >
              <span className="text-base w-5 text-center">{ICONS[cat]}</span>
              <span>{labels[cat]}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            </button>
          );
        })}
      </nav>

      {/* Settings button — pinned to bottom */}
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                   text-white/40 hover:text-white/70 hover:bg-white/5
                   transition-all duration-150 w-full mt-2"
      >
        <span className="text-base w-5 text-center">⚙️</span>
        <span>API Settings</span>
      </button>
    </aside>
  );
}