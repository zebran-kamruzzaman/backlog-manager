// src/renderer/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { Category, SortMode } from '../shared/types';
import type { BacklogItem, SearchResult } from '../shared/types';
import { Sidebar }        from './components/Sidebar';
import { BacklogList }    from './components/BacklogList';
import { SearchModal }    from './components/SearchModal';
import { SortBar }        from './components/SortBar';
import { SettingsModal }  from './components/SettingsModal';

const CATEGORY_LABELS: Record<Category, string> = {
  [Category.Movies]     : 'Movies',
  [Category.TV]         : 'TV Shows',
  [Category.Anime]      : 'Anime',
  [Category.Games]      : 'Games',
  [Category.Restaurants]: 'Restaurants',
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category>(Category.Movies);
  const [items,          setItems]          = useState<BacklogItem[]>([]);
  const [sortMode,       setSortMode]       = useState<SortMode>(SortMode.CustomPriority);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [loading,        setLoading]        = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const [itemsRes, sortRes] = await Promise.all([
      window.backlogAPI.getItems(activeCategory),
      window.backlogAPI.getSortMode(activeCategory),
    ]);
    if (itemsRes.success && itemsRes.data) setItems(itemsRes.data);
    if (sortRes.success  && sortRes.data)  setSortMode(sortRes.data);
    setLoading(false);
  }, [activeCategory]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleSortChange = async (mode: SortMode) => {
    await window.backlogAPI.setSortMode(activeCategory, mode);
    setSortMode(mode);
    loadItems();
  };

  const handleToggleLogged = async (id: number) => {
    const res = await window.backlogAPI.toggleLogged(id);
    if (res.success) loadItems();
  };

  const handleRemove = async (id: number) => {
    const res = await window.backlogAPI.removeItem(id);
    if (res.success) loadItems();
  };

  const handleReorder = async (orderedIds: number[]) => {
    const res = await window.backlogAPI.reorder({ category: activeCategory, orderedIds });
    if (res.success) {
      setSortMode(SortMode.CustomPriority);
      loadItems();
    }
  };

  const handleAddFromSearch = async (result: SearchResult) => {
    const res = await window.backlogAPI.addItem({
      externalId  : result.externalId,
      category    : result.category,
      title       : result.title,
      heroImageUrl: result.heroImageUrl,
      thumbnailUrl: result.thumbnailUrl,
      releaseYear : result.releaseYear,
      rating      : result.rating,
      notes       : null,
    });
    if (res.success) { setSearchOpen(false); loadItems(); }
  };

  const activeItems = items.filter((i) => !i.isLogged);
  const loggedItems = items.filter((i) =>  i.isLogged);

  return (
    <div className="flex h-screen bg-surface-900 text-white overflow-hidden">
      <Sidebar
        categories={Object.values(Category)}
        labels={CATEGORY_LABELS}
        active={activeCategory}
        onSelect={setActiveCategory}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{CATEGORY_LABELS[activeCategory]}</h1>
            <p className="text-sm text-white/40 mt-1">
              {activeItems.length} in backlog · {loggedItems.length} logged
            </p>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add Item
          </button>
        </header>

        <SortBar current={sortMode} onChange={handleSortChange} />

        <main className="flex-1 overflow-y-auto px-8 pb-8">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-white/30 text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="text-4xl">🎬</p>
              <p className="text-white/50 text-sm">Your {CATEGORY_LABELS[activeCategory]} backlog is empty.</p>
              <button onClick={() => setSearchOpen(true)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors">
                Add your first item
              </button>
            </div>
          ) : (
            <BacklogList
              activeItems={activeItems}
              loggedItems={loggedItems}
              onToggleLogged={handleToggleLogged}
              onRemove={handleRemove}
              onReorder={handleReorder}
              sortMode={sortMode}
            />
          )}
        </main>
      </div>

      {searchOpen   && <SearchModal  category={activeCategory} onAdd={handleAddFromSearch} onClose={() => setSearchOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}