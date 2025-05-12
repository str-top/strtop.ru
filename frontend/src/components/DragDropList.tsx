import { useState } from 'react';

export function DragDropList({ items, onReorder }: {
  items: Array<{id: string, name: string, icon: string}>,
  onReorder: (ids: string[]) => void
}) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', (e.target as HTMLElement).innerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const newItems = [...items];
    const [removed] = newItems.splice(draggedItem, 1);
    newItems.splice(index, 0, removed);

    onReorder(newItems.map(item => item.id));
    setDraggedItem(null);
  };

  return (
    <div className="drag-drop-list">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`draggable-item ${draggedItem === index ? 'dragging' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
        >
          <img src={item.icon} alt={item.name} />
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  );
}
