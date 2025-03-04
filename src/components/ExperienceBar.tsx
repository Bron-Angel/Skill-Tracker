'use client';

interface ExperienceBarProps {
  currentExperience: number;
  experienceNeeded: number;
}

export function ExperienceBar({ currentExperience, experienceNeeded }: ExperienceBarProps) {
  const percentage = Math.min((currentExperience / experienceNeeded) * 100, 100);

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {currentExperience} / {experienceNeeded} XP
        </span>
        <span className="text-sm font-medium text-gray-700">{percentage.toFixed(0)}%</span>
      </div>
      <div className="experience-bar">
        <div 
          className="experience-fill animate-glow" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
} 