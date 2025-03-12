'use client';

interface SkillsPageItemProps {
  name: string;
  emoji: string;
  experienceNeeded: number;
  isUnlocked: boolean;
}

export function SkillsPageItem({
  name,
  emoji,
  experienceNeeded,
  isUnlocked,
}: SkillsPageItemProps) {
  return (
    <div
      className={`flex flex-col items-center p-2 ${isUnlocked ? 'skill-glow' : ''}`}
    >
      <div className="relative mb-2">
        <div 
          className="skill-emoji"
          style={{
            filter: isUnlocked ? 'grayscale(0)' : 'grayscale(100%)',
            opacity: isUnlocked ? 1 : 0.6,
          }}
        >
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