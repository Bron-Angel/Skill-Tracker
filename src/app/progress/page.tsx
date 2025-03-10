'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ExperienceBar } from '@/components/ExperienceBar';
import { SkillItem } from '@/components/SkillItem';

interface Skill {
  id: string;
  name: string;
  experienceNeeded: number;
  cumulativeExperienceNeeded: number;
  emoji: string;
  isUnlocked: boolean;
}

interface Level {
  id: string;
  name: string;
  experienceNeeded: number;
}

interface UserProgress {
  level: number;
  experience: number;
  totalExperienceForNextLevel: number;
  unlockedSkills: Skill[];
  skillsToUnlock: Skill[];
  skills: Skill[];
  nextLevel: number | null;
  levelProgress: {
    expInCurrentLevel: number;
    expNeededForNextLevel: number;
    progressPercentage: number;
  };
}

export default function ProgressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [experienceInput, setExperienceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserProgress();
    }
  }, [status, router]);

  const fetchUserProgress = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/user/progress');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user progress');
      }
      const data = await response.json();
      console.log('Progress data:', data);
      setProgress(data);
    } catch (err: any) {
      console.error('Error fetching progress:', err);
      setError(`Failed to load your progress: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const expPoints = parseInt(experienceInput);
    if (isNaN(expPoints)) {
      setError('Please enter a valid number');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/user/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ experiencePoints: expPoints }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update progress');
      }

      await fetchUserProgress();
      setExperienceInput('');
    } catch (err: any) {
      console.error('Error updating progress:', err);
      setError(`Failed to update your progress: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Current Progress</h1>
        <p className="text-red-600">{error || 'No progress data available'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Current Progress</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Level {progress.level}</h2>
            <span className="text-sm font-medium text-gray-600">
              Total XP: {progress.experience}
            </span>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress to Level {progress.nextLevel}</span>
            <span>{progress.levelProgress.expInCurrentLevel} / {progress.levelProgress.expNeededForNextLevel} XP</span>
          </div>
          
          <ExperienceBar 
            currentExperience={progress.levelProgress.expInCurrentLevel} 
            experienceNeeded={progress.levelProgress.expNeededForNextLevel} 
          />
          
          <p className="text-xs text-gray-500 mt-1">
            {progress.levelProgress.progressPercentage.toFixed(0)}% complete - 
            {progress.levelProgress.expNeededForNextLevel - progress.levelProgress.expInCurrentLevel} XP needed for Level {progress.nextLevel}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="experienceInput" className="block text-gray-700 font-medium mb-2">
                Update Experience Points
              </label>
              <input
                type="number"
                id="experienceInput"
                value={experienceInput}
                onChange={(e) => setExperienceInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter experience points"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter a positive value to add experience points or a negative value to remove experience points.
                Removing points may reverse unlocked skills and levels.
              </p>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Experience'}
            </button>
          </div>
          
          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </form>

        <div>
          <h3 className="text-lg font-semibold mb-4">
            {progress.nextLevel ? `Skills in Level ${progress.nextLevel}` : 'No More Skills to Unlock'}
          </h3>
          
          {progress.skills && progress.skills.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {progress.skills.map((skill) => (
                <div 
                  key={skill.id} 
                  className={`flex flex-col items-center p-2 ${skill.isUnlocked ? 'skill-glow' : ''}`}
                >
                  <div className="relative mb-2">
                    <div className={`skill-emoji ${skill.isUnlocked ? 'skill-unlocked' : 'skill-locked'}`}>
                      <span className="text-4xl">{skill.emoji || '❓'}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-1 rounded-tl-md">
                      {skill.cumulativeExperienceNeeded} XP
                    </div>
                  </div>
                  <span className="text-sm font-medium text-center">{skill.name}</span>
                  <span className="text-xs text-gray-500 text-center">+{skill.experienceNeeded} XP</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              {progress.nextLevel 
                ? `No skills assigned to Level ${progress.nextLevel} yet. Visit the Skill Tree page to assign skills.` 
                : 'You have reached the maximum level! No more skills to unlock.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 