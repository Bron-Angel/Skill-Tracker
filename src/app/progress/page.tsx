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
  imageUrl: string;
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
    try {
      const response = await fetch('/api/user/progress');
      if (!response.ok) {
        throw new Error('Failed to fetch user progress');
      }
      const data = await response.json();
      setProgress(data);
    } catch (err) {
      setError('Failed to load your progress. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const expPoints = parseInt(experienceInput);
    if (isNaN(expPoints) || expPoints <= 0) {
      setError('Please enter a valid positive number');
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
        throw new Error('Failed to update progress');
      }

      const data = await response.json();
      setProgress(data);
      setExperienceInput('');
    } catch (err) {
      setError('Failed to update your progress. Please try again.');
      console.error(err);
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
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Level {progress.level}</h2>
          <ExperienceBar 
            currentExperience={progress.experience} 
            experienceNeeded={progress.totalExperienceForNextLevel} 
          />
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="experienceInput" className="block text-gray-700 font-medium mb-2">
                Add Experience Points
              </label>
              <input
                type="number"
                id="experienceInput"
                value={experienceInput}
                onChange={(e) => setExperienceInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter experience points"
                min="1"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                1 exp pt = 1 chore, 1 practice session, or 1 lesson
              </p>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Add Experience'}
            </button>
          </div>
          
          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </form>

        <div>
          <h3 className="text-lg font-semibold mb-4">Skills in Current Level</h3>
          
          {progress.unlockedSkills.length === 0 && progress.skillsToUnlock.length === 0 ? (
            <p className="text-gray-600">No skills assigned to this level yet. Visit the Skill Tree page to assign skills.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {progress.unlockedSkills.map((skill) => (
                <SkillItem
                  key={skill.id}
                  name={skill.name}
                  imageUrl={skill.imageUrl}
                  experienceNeeded={skill.experienceNeeded}
                  isUnlocked={true}
                />
              ))}
              
              {progress.skillsToUnlock.map((skill) => (
                <SkillItem
                  key={skill.id}
                  name={skill.name}
                  imageUrl={skill.imageUrl}
                  experienceNeeded={skill.experienceNeeded}
                  isUnlocked={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 