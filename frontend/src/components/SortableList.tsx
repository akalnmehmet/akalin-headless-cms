import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

// ── Sürüklenebilir satır sarmalayıcı ─────────────────────────────────────────
interface SortableItemProps {
  id: string;
  children: (props: { dragHandleProps: React.HTMLAttributes<HTMLElement>; isDragging: boolean }) => React.ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({
        dragHandleProps: { ...attributes, ...listeners },
        isDragging,
      })}
    </div>
  );
}

// ── Liste sarmalayıcı ─────────────────────────────────────────────────────────
interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (
    item: T,
    dragHandleProps: React.HTMLAttributes<HTMLElement>
  ) => React.ReactNode;
  renderOverlay?: (item: T) => React.ReactNode;
}

export default function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  renderOverlay,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIdx = items.findIndex((i) => i.id === String(active.id));
    const newIdx = items.findIndex((i) => i.id === String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    onReorder(reordered);
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {({ dragHandleProps }) => renderItem(item, dragHandleProps)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>

      {/* Sürüklenen elemanın ghost görüntüsü */}
      <DragOverlay>
        {activeItem && renderOverlay
          ? renderOverlay(activeItem)
          : activeItem
          ? renderItem(activeItem, {})
          : null}
      </DragOverlay>
    </DndContext>
  );
}
