// src/renderer/components/SortBar.tsx
import { SortMode } from '../../shared/types';

const MODES: { mode: SortMode; label: string; icon: string }[] = [
  { mode: SortMode.CustomPriority, label: 'Priority',     icon: '⭐' },
  { mode: SortMode.Bespoke,        label: 'Smart Sort',   icon: '✨' },
  { mode: SortMode.Alphabetical,   label: 'A → Z',        icon: '🔤' },
  { mode: SortMode.Chronological,  label: 'By Year',      icon: '📅' },
];

interface Props {
  current : SortMode;
  onChange: (mode: SortMode) => void;
}

export function SortBar({ current, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 px-8 pb-4 shrink-0">
      <span className="text-xs text-white/30 mr-1 uppercase tracking-widest">Sort</span>
      {MODES.map(({ mode, label, icon }) => {
        const active = mode === current;
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-150
              ${active
                ? 'bg-indigo-500/25 text-indigo-300 ring-1 ring-indigo-500/40'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'}
            `}
          >
            <span>{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}