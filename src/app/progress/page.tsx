'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ExperienceBar } from '@/components/ExperienceBar';
import { SkillItem } from '@/components/SkillItem';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyUnlockedSkills, setNewlyUnlockedSkills] = useState<string[]>([]);
  const prevLevelRef = useRef<number | null>(null);
  const prevUnlockedSkillsRef = useRef<string[]>([]);
  const animationInProgressRef = useRef<boolean>(false);
  const { width, height } = useWindowSize();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for level up sound
    try {
      audioRef.current = new Audio('/level-up.mp3');
      // Add error handling for the audio
      audioRef.current.addEventListener('error', (e) => {
        console.warn('Error loading level-up sound:', e);
      });
    } catch (err) {
      console.warn('Could not create audio element:', err);
    }
    
    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserProgress();
    }
  }, [status, router]);

  // Effect to check for level up and trigger confetti
  useEffect(() => {
    if (!progress) return;
    
    console.log('Progress update detected:', { 
      currentLevel: progress.level, 
      previousLevel: prevLevelRef.current,
      currentUnlockedSkills: progress.unlockedSkills?.length || 0,
      previousUnlockedSkills: prevUnlockedSkillsRef.current?.length || 0,
      animationInProgress: animationInProgressRef.current
    });
    
    // Only check for level changes if we have a previous level to compare with
    // AND no animation is currently in progress
    if (prevLevelRef.current !== null && !animationInProgressRef.current) {
      // Check for level up - ONLY trigger confetti for level changes
      if (progress.level > prevLevelRef.current) {
        // True level up detected!
        console.log('LEVEL UP DETECTED! Showing confetti!', { 
          from: prevLevelRef.current, 
          to: progress.level 
        });
        
        // Set the animation flag to prevent multiple animations
        animationInProgressRef.current = true;
        setShowConfetti(true);
        
        // Play level up sound
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => {
            console.warn('Error playing level-up sound:', err);
            // Continue with confetti even if sound fails
          });
        }
        
        // Hide confetti after 5 seconds and reset the animation flag
        const timer = setTimeout(() => {
          setShowConfetti(false);
          animationInProgressRef.current = false;
        }, 5000);
        
        return () => {
          clearTimeout(timer);
          animationInProgressRef.current = false;
        };
      }
    }
    
    // Handle newly unlocked skills separately - NEVER trigger confetti for this
    if (progress.unlockedSkills && prevUnlockedSkillsRef.current && !animationInProgressRef.current) {
      const currentUnlockedIds = progress.unlockedSkills.map(skill => skill.id);
      const previousUnlockedIds = prevUnlockedSkillsRef.current;
      
      // Find skills that are newly unlocked
      const newlyUnlocked = currentUnlockedIds.filter(id => !previousUnlockedIds.includes(id));
      
      if (newlyUnlocked.length > 0) {
        console.log('New skills unlocked, but NOT showing confetti:', newlyUnlocked);
        
        setNewlyUnlockedSkills(newlyUnlocked);
        
        // Clear the newly unlocked skills after 5 seconds
        const timer = setTimeout(() => {
          setNewlyUnlockedSkills([]);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
    
    // Always update the refs at the end
    prevLevelRef.current = progress.level;
    prevUnlockedSkillsRef.current = progress.unlockedSkills ? progress.unlockedSkills.map(skill => skill.id) : [];
  }, [progress]);

  // Add a cleanup effect for the animation flag
  useEffect(() => {
    return () => {
      // Reset animation flag when component unmounts
      animationInProgressRef.current = false;
    };
  }, []);

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
      
      // Initialize the previous level and skills on first load
      // This prevents false positives for level-up detection on initial load
      if (prevLevelRef.current === null) {
        prevLevelRef.current = data.level;
      }
      
      if (prevUnlockedSkillsRef.current === null || prevUnlockedSkillsRef.current.length === 0) {
        prevUnlockedSkillsRef.current = data.unlockedSkills ? data.unlockedSkills.map((skill: Skill) => skill.id) : [];
      }
      
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
      // Store current values before the update
      // Convert undefined to null to match the expected type
      const currentLevel = progress?.level ?? null;
      const currentUnlockedSkills = progress?.unlockedSkills ? 
        progress.unlockedSkills.map(skill => skill.id) : [];
      
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

      // Update the previous level and skills references
      // This ensures we correctly detect level changes
      if (progress) {
        prevLevelRef.current = currentLevel;
        prevUnlockedSkillsRef.current = currentUnlockedSkills;
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

  const triggerLevelUpAnimation = () => {
    // This function is only for testing the level-up animation
    // Don't trigger if animation is already in progress
    if (animationInProgressRef.current) {
      console.log('Animation already in progress, ignoring test button click');
      return;
    }
    
    // Set the animation flag to prevent multiple animations
    animationInProgressRef.current = true;
    setShowConfetti(true);
    
    // Play level up sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.warn('Error playing level-up sound:', err);
      });
    }
    
    // Hide confetti after 5 seconds and reset the animation flag
    setTimeout(() => {
      setShowConfetti(false);
      animationInProgressRef.current = false;
    }, 5000);
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
      {/* Confetti component that shows when leveling up */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
        />
      )}
      
      <h1 className="text-2xl font-bold mb-6 text-center">Current Progress</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Level up message - only shown when reaching a new level */}
      {showConfetti && (
        <div className="bg-green-100 border-2 border-green-400 text-green-800 px-4 py-3 rounded-lg mb-6 text-center level-up-message">
          <h2 className="text-xl font-bold">
            <span role="img" aria-label="celebration">🎉</span> Level Up! <span role="img" aria-label="celebration">🎉</span>
          </h2>
          <p className="font-medium">Congratulations! You've reached Level {progress?.level}!</p>
          <p className="text-sm mt-1">You can now unlock new skills!</p>
        </div>
      )}
      
      {/* Hidden test button - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 text-right">
          <button
            onClick={triggerLevelUpAnimation}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
            title="Test level up animation"
          >
            Test Level Up Animation
          </button>
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
                  className={`flex flex-col items-center p-2 ${
                    skill.isUnlocked ? 'skill-glow' : ''
                  } ${
                    newlyUnlockedSkills.includes(skill.id) ? 'skill-unlocked' : ''
                  }`}
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
                  {newlyUnlockedSkills.includes(skill.id) && (
                    <span className="mt-1 text-xs font-bold text-green-600">Newly Unlocked!</span>
                  )}
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