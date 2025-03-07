'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Improved wrapper component to fix issues with react-beautiful-dnd in React 18
export function DragDropContextWrapper({ children, onDragEnd }: { 
  children: React.ReactNode; 
  onDragEnd: (result: DropResult) => void;
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // This is a workaround for a bug in react-beautiful-dnd with React 18
    // See: https://github.com/atlassian/react-beautiful-dnd/issues/2399
    const animation = requestAnimationFrame(() => setEnabled(true));
    
    // Polyfill for the drag-and-drop HTML5 backend
    if (typeof window !== 'undefined') {
      window.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      
      window.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }
    
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        
        window.removeEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      }
    };
  }, []);

  if (!enabled) {
    return <div className="loading-drag-drop">{children}</div>;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  );
}

// Improved Droppable wrapper
export function DroppableWrapper({ 
  droppableId, 
  direction = 'vertical',
  className,
  children 
}: { 
  droppableId: string; 
  direction?: 'horizontal' | 'vertical';
  className?: string;
  children: (provided: any) => React.ReactNode;
}) {
  return (
    <Droppable droppableId={droppableId} direction={direction}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`${className || ''} ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
        >
          {children(provided)}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

// Improved Draggable wrapper
export function DraggableWrapper({
  draggableId,
  index,
  className,
  children
}: {
  draggableId: string;
  index: number;
  className?: string;
  children: (provided: any, snapshot: any) => React.ReactNode;
}) {
  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${className || ''} ${snapshot.isDragging ? 'opacity-50' : ''}`}
          style={{
            ...provided.draggableProps.style,
          }}
        >
          {children(provided, snapshot)}
        </div>
      )}
    </Draggable>
  );
}

export { Droppable, Draggable }; 