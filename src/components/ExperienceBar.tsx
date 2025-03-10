'use client';

interface ExperienceBarProps {
  currentExperience: number;
  experienceNeeded: number;
}

export function ExperienceBar({ currentExperience, experienceNeeded }: ExperienceBarProps) {
  // Handle edge cases:
  // 1. If experienceNeeded is 0 or negative, show 0% progress
  // 2. Ensure percentage is between 0 and 100
  const percentage = experienceNeeded <= 0 ? 
    0 : 
    Math.min(Math.max(0, (currentExperience / experienceNeeded) * 100), 100);

  return (
    <div className="w-full mb-2">
      <div className="experience-bar">
        <div 
          className="experience-fill animate-glow" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
} 