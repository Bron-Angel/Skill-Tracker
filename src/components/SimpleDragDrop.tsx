'use client';

import React, { useState, useRef } from 'react';

interface DraggableProps {
  id: string;
  index: number;
  onDragStart: (id: string, index: number) => void;
  className?: string;
  children: React.ReactNode;
}

interface DroppableProps {
  id: string;
  onDrop: (sourceId: string, sourceIndex: number, targetId: string, targetIndex: number) => void;
  className?: string;
  children: React.ReactNode;
}

interface DragDropContextProps {
  onDragEnd?: (result: { source: { id: string, index: number }, destination: { id: string, index: number } }) => void;
  children: React.ReactNode;
}

// Global state for drag and drop
let draggedItemId: string | null = null;
let draggedItemIndex: number | null = null;
let draggedSourceId: string | null = null;

export function Draggable({ id, index, onDragStart, className, children }: DraggableProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    draggedItemId = id;
    draggedItemIndex = index;
    draggedSourceId = e.currentTarget.parentElement?.getAttribute('data-droppable-id') || null;
    
    // Set data for HTML5 drag and drop
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id,
      index,
      sourceId: draggedSourceId
    }));
    
    // Call the onDragStart callback
    onDragStart(id, index);
    
    // Add a class to the body to indicate dragging
    document.body.classList.add('dragging');
    
    // Set the drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = id;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Remove the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };
  
  const handleDragEnd = () => {
    document.body.classList.remove('dragging');
    draggedItemId = null;
    draggedItemIndex = null;
    draggedSourceId = null;
  };
  
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`draggable ${className || ''}`}
      data-draggable-id={id}
      data-draggable-index={index}
    >
      {children}
    </div>
  );
}

export function Droppable({ id, onDrop, className, children }: DroppableProps) {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('droppable-active');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('droppable-active');
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('droppable-active');
    
    if (draggedItemId === null || draggedItemIndex === null || draggedSourceId === null) {
      return;
    }
    
    // Get the target index
    const targetIndex = Array.from(e.currentTarget.children)
      .filter(child => child.classList.contains('draggable'))
      .length;
    
    // Call the onDrop callback
    onDrop(draggedSourceId, draggedItemIndex, id, targetIndex);
  };
  
  return (
    <div
      className={`droppable ${className || ''}`}
      data-droppable-id={id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}

export function DragDropContext({ onDragEnd, children }: DragDropContextProps) {
  return (
    <div className="drag-drop-context">
      {children}
    </div>
  );
}