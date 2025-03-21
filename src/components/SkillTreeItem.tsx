'use client';

interface SkillTreeItemProps {
  name: string;
  emoji: string;
  experienceNeeded: number;
  isUnlocked: boolean;
}

export function SkillTreeItem({
  name,
  emoji,
  experienceNeeded,
  isUnlocked,
}: SkillTreeItemProps) {
  return (
    <div
      className={`flex flex-col items-center p-2 ${isUnlocked ? 'skill-glow' : ''}`}
      data-skill-name={name}
      data-skill-emoji={emoji}
      data-skill-xp={experienceNeeded}
      data-skill-unlocked={isUnlocked ? 'true' : 'false'}
    >
      <div className="relative mb-2">
        <div className="skill-emoji skill-tree-emoji">
          <span className="text-4xl">{emoji || '❓'}</span>
        </div>
        <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-1 rounded-tl-md">
          {experienceNeeded} XP
        </div>
      </div>
      <span className="text-sm font-medium text-center">{name}</span>
    </div>
  );
} 