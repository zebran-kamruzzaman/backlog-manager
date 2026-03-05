// src/renderer/components/SearchModal.tsx
import { useState, useRef, useEffect } from 'react';
import { Category } from '../../shared/types';
import type { SearchResult } from '../../shared/types';
import { decodeCuisineIcon } from '../../shared/cuisineIcons';


interface Props {
  category: Category;
  onAdd   : (result: SearchResult) => void;
  onClose : () => void;
}

export function SearchModal({ category, onAdd, onClose }: Props) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const runSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setError(null);
    const res = await window.backlogAPI.search(category, q.trim());
    setLoading(false);
    if (res.success && res.data) setResults(res.data);
    else setError(res.error ?? 'Search failed');
  };

  const handleChange = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 450);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl bg-surface-700 rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <span className="text-white/40 text-lg">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Search ${category}…`}
            className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
          />
          {loading && <Spinner />}
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-sm transition-colors">
            ✕
          </button>
        </div>

        {/* Results */}
        <div className="max-h-120 overflow-y-auto">
          {error && (
            <p className="text-red-400 text-sm px-4 py-6 text-center">{error}</p>
          )}

          {!error && results.length === 0 && query.trim() && !loading && (
            <p className="text-white/30 text-sm px-4 py-6 text-center">No results found.</p>
          )}

          {!error && results.length === 0 && !query.trim() && (
            <p className="text-white/20 text-sm px-4 py-6 text-center">Start typing to search…</p>
          )}

          {results.map((r) => (
            <SearchResultRow key={r.externalId} result={r} onAdd={onAdd} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchResultRow({ result, onAdd }: { result: SearchResult; onAdd: (r: SearchResult) => void }) {
  const cuisineIcon = decodeCuisineIcon(result.thumbnailUrl);

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group">
      <div className="w-10 h-14 shrink-0 rounded-md overflow-hidden bg-white/5 flex items-center justify-center">
        {cuisineIcon ? (
          <span className="text-2xl">{cuisineIcon}</span>
        ) : result.thumbnailUrl ? (
          <img src={result.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-white/5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">{result.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {result.releaseYear && <span className="text-xs text-white/30">{result.releaseYear}</span>}
          {result.rating != null && <span className="text-xs text-amber-400/70">★ {result.rating.toFixed(1)}</span>}
        </div>
      </div>
      <button
        onClick={() => onAdd(result)}
        className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white text-xs font-semibold transition-all duration-150 opacity-0 group-hover:opacity-100"
      >
        + Add
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  );
}