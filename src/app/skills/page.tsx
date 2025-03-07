'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SkillItem } from '@/components/SkillItem';

interface Skill {
  id: string;
  name: string;
  experienceNeeded: number;
  emoji: string;
  isUnlocked: boolean;
}

export default function SkillsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserSkills();
    }
  }, [status, router]);

  const fetchUserSkills = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('Fetching user skills...');
      const response = await fetch('/api/user/skills');
      if (!response.ok) {
        throw new Error('Failed to fetch user skills');
      }
      const data = await response.json();
      console.log('User skills data:', data);
      setSkills(data.skills);
    } catch (err) {
      console.error('Error fetching user skills:', err);
      setError('Failed to load your skills. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">My Skills</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : skills.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't set up your skill tree yet.</p>
            <button
              onClick={() => router.push('/skill-tree')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
            >
              Set Up Skill Tree
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Total Skills: {skills.length} | Unlocked: {skills.filter(s => s.isUnlocked).length}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {skills.map((skill) => (
                <SkillItem
                  key={skill.id}
                  name={skill.name}
                  emoji={skill.emoji}
                  experienceNeeded={skill.experienceNeeded}
                  isUnlocked={skill.isUnlocked}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 