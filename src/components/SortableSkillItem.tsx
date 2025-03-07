'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SkillItem } from './SkillItem';

interface Skill {
  id: string;
  name: string;
  experienceNeeded: number;
  emoji: string;
  isUnlocked: boolean;
}

interface SortableSkillItemProps {
  id: string;
  skill: Skill;
  containerId: string;
}

export function SortableSkillItem({ id, skill, containerId }: SortableSkillItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id, 
    data: { 
      type: 'skill',
      skill,
      containerId,
      isPlaceholder: false
    } 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    position: 'relative' as const,
    touchAction: 'none' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-md shadow-sm cursor-grab active:cursor-grabbing"
      data-skill-id={id}
      data-container-id={containerId}
    >
      <SkillItem
        name={skill.name}
        emoji={skill.emoji}
        experienceNeeded={skill.experienceNeeded}
        isUnlocked={skill.isUnlocked}
        isDraggable={true}
      />
    </div>
  );
}