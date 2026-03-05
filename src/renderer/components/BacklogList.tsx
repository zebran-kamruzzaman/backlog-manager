// src/renderer/components/BacklogList.tsx
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { SortMode } from '../../shared/types';
import type { BacklogItem } from '../../shared/types';
import { HeroItem }    from './HeroItem';
import { CompactItem } from './CompactItem';

interface Props {
  activeItems    : BacklogItem[];
  loggedItems    : BacklogItem[];
  onToggleLogged : (id: number) => void;
  onRemove       : (id: number) => void;
  onReorder      : (orderedIds: number[]) => void;
  sortMode       : SortMode;
}

export function BacklogList({
  activeItems, loggedItems, onToggleLogged, onRemove, onReorder, sortMode,
}: Props) {
  const isDraggable = sortMode === SortMode.CustomPriority;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const reordered = [...activeItems];
    const [moved]   = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Always pass logged IDs appended at end (their order stays stable)
    onReorder([...reordered.map((i) => i.id), ...loggedItems.map((i) => i.id)]);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Active items (draggable) ── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="active-list">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-col"
            >
              {activeItems.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={String(item.id)}
                  index={index}
                  isDragDisabled={!isDraggable}
                >
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      {...drag.dragHandleProps}
                      className={snapshot.isDragging ? 'opacity-80 scale-[1.01]' : ''}
                      style={drag.draggableProps.style}
                    >
                      {index === 0 ? (
                        <HeroItem
                          item={item}
                          onToggleLogged={onToggleLogged}
                          onRemove={onRemove}
                          isDraggable={isDraggable}
                        />
                      ) : (
                        <CompactItem
                          item={item}
                          onToggleLogged={onToggleLogged}
                          onRemove={onRemove}
                          isDraggable={isDraggable}
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* ── Logged / completed section ── */}
      {loggedItems.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs uppercase tracking-widest text-white/25">Logged</span>
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/25">{loggedItems.length}</span>
          </div>
          {loggedItems.map((item) => (
            <CompactItem
              key={item.id}
              item={item}
              onToggleLogged={onToggleLogged}
              onRemove={onRemove}
              isDraggable={false}
              isLogged
            />
          ))}
        </div>
      )}
    </div>
  );
}