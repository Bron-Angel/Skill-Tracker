'use client';

interface SkillItemProps {
  name: string;
  imageUrl: string;
  experienceNeeded: number;
  isUnlocked: boolean;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function SkillItem({
  name,
  imageUrl,
  experienceNeeded,
  isUnlocked,
  isDraggable = false,
  onDragStart,
}: SkillItemProps) {
  return (
    <div
      className={`flex flex-col items-center p-2 ${
        isDraggable ? 'draggable-skill' : ''
      } ${isUnlocked ? 'skill-glow' : ''}`}
      draggable={isDraggable}
      onDragStart={onDragStart}
    >
      <div className="relative mb-2">
        <img
          src={imageUrl || '/images/skills/placeholder.png'}
          alt={name}
          className={`skill-image ${isUnlocked ? 'skill-unlocked' : 'skill-locked'}`}
        />
        <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-1 rounded-tl-md">
          {experienceNeeded} XP
        </div>
      </div>
      <span className="text-sm font-medium text-center">{name}</span>
    </div>
  );
} 