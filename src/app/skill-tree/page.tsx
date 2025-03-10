'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SkillTreeItem } from '@/components/SkillTreeItem';

interface Skill {
  id: string;
  name: string;
  experienceNeeded: number;
  emoji: string;
  isUnlocked: boolean;
}

interface Level {
  id: string;
  name: string;
  experienceNeeded: number;
  newSkillCount: number;
  skills: Skill[];
}

export default function SkillTreePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [unassignedSkills, setUnassignedSkills] = useState<Skill[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [originalState, setOriginalState] = useState<{
    levels: Level[];
    unassignedSkills: Skill[];
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchSkillTreeData();
    }
  }, [status, router]);

  // Track unsaved changes
  useEffect(() => {
    if (originalState) {
      // Check if current state differs from original state
      const levelsChanged = JSON.stringify(levels) !== JSON.stringify(originalState.levels);
      const unassignedChanged = JSON.stringify(unassignedSkills) !== JSON.stringify(originalState.unassignedSkills);
      
      setHasChanges(levelsChanged || unassignedChanged);
    }
  }, [levels, unassignedSkills, originalState]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

  const fetchSkillTreeData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/skill-tree');
      if (!response.ok) {
        throw new Error('Failed to fetch skill tree data');
      }
      const data = await response.json();
      console.log('Fetched skill tree data:', data);
      
      // Store the original state for change detection
      setOriginalState({
        levels: JSON.parse(JSON.stringify(data.levels)),
        unassignedSkills: JSON.parse(JSON.stringify(data.unassignedSkills))
      });
      
      setLevels(data.levels);
      setUnassignedSkills(data.unassignedSkills);
      setHasChanges(false);
      
      // Combine all skills for dropdown options
      const allSkillsArray = [
        ...data.unassignedSkills,
        ...data.levels.flatMap((level: Level) => level.skills)
      ];
      setAllSkills(allSkillsArray);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching skill tree data:', err);
      setError('Failed to load skill tree data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillAssignment = (levelId: string, slotIndex: number, skillId: string | null) => {
    // Find the level
    const levelIndex = levels.findIndex(level => level.id === levelId);
    if (levelIndex === -1) return;

    // Create a copy of the levels array
    const newLevels = [...levels];
    const level = newLevels[levelIndex];

    // If removing a skill (skillId is null)
    if (!skillId) {
      // If there's a skill in this slot, move it to unassigned
      if (slotIndex < level.skills.length) {
        const removedSkill = level.skills[slotIndex];
        setUnassignedSkills(prev => [...prev, removedSkill]);
        level.skills.splice(slotIndex, 1);
      }
      setLevels(newLevels);
      return;
    }

    // Find the skill
    const skill = allSkills.find(s => s.id === skillId);
    if (!skill) return;

    // Check if the skill is already assigned to this level
    const isAlreadyInLevel = level.skills.some(s => s.id === skillId);
    if (isAlreadyInLevel) {
      setError(`Skill "${skill.name}" is already assigned to ${level.name}`);
      return;
    }

    // Check if the skill is assigned to another level
    const otherLevelWithSkill = levels.find(l => 
      l.id !== levelId && l.skills.some(s => s.id === skillId)
    );
    
    if (otherLevelWithSkill) {
      // Remove the skill from the other level
      const otherLevelIndex = levels.findIndex(l => l.id === otherLevelWithSkill.id);
      const skillIndex = newLevels[otherLevelIndex].skills.findIndex(s => s.id === skillId);
      newLevels[otherLevelIndex].skills.splice(skillIndex, 1);
    } else {
      // Remove the skill from unassigned
      setUnassignedSkills(prev => prev.filter(s => s.id !== skillId));
    }

    // If we're replacing a skill in an existing slot
    if (slotIndex < level.skills.length) {
      const replacedSkill = level.skills[slotIndex];
      setUnassignedSkills(prev => [...prev, replacedSkill]);
      level.skills[slotIndex] = skill;
    } else {
      // Add the skill to the level
      level.skills.push(skill);
    }

    setLevels(newLevels);
    setError('');
  };

  const handleRemoveSkill = (levelId: string, skillIndex: number) => {
    // Find the level
    const levelIndex = levels.findIndex(level => level.id === levelId);
    if (levelIndex === -1) return;

    // Create a copy of the levels array
    const newLevels = [...levels];
    const level = newLevels[levelIndex];

    // Remove the skill and add it to unassigned
    if (skillIndex < level.skills.length) {
      const removedSkill = level.skills[skillIndex];
      setUnassignedSkills(prev => [...prev, removedSkill]);
      level.skills.splice(skillIndex, 1);
      setLevels(newLevels);
    }
  };

  const handleSaveSkillTree = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const skillTreeConfig = levels.flatMap((level: Level) =>
        level.skills.map((skill) => ({
          levelId: level.id,
          skillId: skill.id,
          position: level.skills.indexOf(skill),
        }))
      );

      console.log('Saving skill tree config:', skillTreeConfig);

      // Don't save if there are no skills to save
      if (skillTreeConfig.length === 0) {
        console.log('No skills to save, skipping API call');
        setSaveSuccess(true);
        setHasChanges(false);
        return;
      }

      const response = await fetch('/api/skill-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillTreeConfig }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save skill tree');
      }

      const result = await response.json();
      console.log('Save result:', result);
      setSaveSuccess(true);
      setHasChanges(false);
      
      // Update the original state to match current state
      setOriginalState({
        levels: JSON.parse(JSON.stringify(levels)),
        unassignedSkills: JSON.parse(JSON.stringify(unassignedSkills))
      });
      
      // Refresh the data after saving
      await fetchSkillTreeData();
    } catch (err) {
      console.error('Error saving skill tree:', err);
      setError('Failed to save your skill tree. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (originalState) {
      setLevels(JSON.parse(JSON.stringify(originalState.levels)));
      setUnassignedSkills(JSON.parse(JSON.stringify(originalState.unassignedSkills)));
      setHasChanges(false);
      setError('');
      setSaveSuccess(false);
    }
  };

  function getNextLevelSkills(levels: Level[], currentLevelName: string): Skill[] {
    // Extract the current level number
    const currentLevelNumber = parseInt(currentLevelName.split(' ').pop() || '0', 10);

    // Sort levels by their number
    const sortedLevels = levels.sort((a, b) => {
      const aNumber = parseInt(a.name.split(' ').pop() || '0', 10);
      const bNumber = parseInt(b.name.split(' ').pop() || '0', 10);
      return aNumber - bNumber;
    });

    // Find the next level in the sequence
    const nextLevel = sortedLevels.find(level => {
      const levelNumber = parseInt(level.name.split(' ').pop() || '0', 10);
      return levelNumber > currentLevelNumber;
    });

    // If no next level is found, return an empty array
    if (!nextLevel) return [];

    // Return the skills assigned to the next level
    return nextLevel.skills;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Skill Tree Builder</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <p className="text-gray-700">
          Use the dropdown menus to assign skills to different levels. Each level has a limited number of skill slots.
          Your progress will be tracked based on this configuration.
        </p>
        {hasChanges && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700 text-sm font-medium">
              You have unsaved changes. Click the "Save Skill Tree" button at the bottom of the page to save your changes.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-md">
          Skill tree saved successfully!
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-3/4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Levels</h2>
            
            {levels.length === 0 ? (
              <p className="text-gray-600">No levels available.</p>
            ) : (
              <div className="space-y-8">
                {levels.map((level: Level) => (
                  <div key={level.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">{level.name}</h3>
                      <span className="text-sm text-gray-600">
                        {level.skills.length}/{level.newSkillCount} skills • {level.experienceNeeded} XP needed
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Render existing skills */}
                      {level.skills.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          {level.skills.map((skill: Skill, index: number) => (
                            <div key={skill.id} className="flex items-center bg-gray-50 p-3 rounded-md">
                              <div className="flex-grow">
                                <SkillTreeItem
                                  name={skill.name}
                                  emoji={skill.emoji}
                                  experienceNeeded={skill.experienceNeeded}
                                  isUnlocked={skill.isUnlocked}
                                />
                              </div>
                              <button
                                onClick={() => handleRemoveSkill(level.id, index)}
                                className="ml-2 p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
                                title="Remove skill"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Render empty skill slots with dropdowns */}
                      {level.skills.length < level.newSkillCount && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {Array.from({ length: level.newSkillCount - level.skills.length }).map((_, index: number) => (
                            <div key={`empty-${index}`} className="border-2 border-dashed border-gray-300 p-3 rounded-md">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assign skill to slot {level.skills.length + index + 1}
                              </label>
                              <select
                                className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                onChange={(e) => handleSkillAssignment(level.id, level.skills.length + index, e.target.value || null)}
                                value=""
                              >
                                <option value="">Select a skill</option>
                                {unassignedSkills.map((skill: Skill) => (
                                  <option key={skill.id} value={skill.id}>
                                    {skill.emoji} {skill.name} ({skill.experienceNeeded} XP)
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:w-1/4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Unassigned Skills
              <span className="ml-2 text-sm text-gray-600">({unassignedSkills.length})</span>
            </h2>
            
            <div className="space-y-4">
              {unassignedSkills.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No unassigned skills available.</p>
              ) : (
                unassignedSkills.map((skill: Skill) => (
                  <div key={skill.id} className="bg-gray-50 p-3 rounded-md">
                    <SkillTreeItem
                      name={skill.name}
                      emoji={skill.emoji}
                      experienceNeeded={skill.experienceNeeded}
                      isUnlocked={skill.isUnlocked}
                    />
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign to level
                      </label>
                      <select
                        className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        onChange={(e) => {
                          if (e.target.value) {
                            const [levelId, slotIndex] = e.target.value.split('|');
                            handleSkillAssignment(levelId, parseInt(slotIndex), skill.id);
                          }
                        }}
                        value=""
                      >
                        <option value="">Select a level</option>
                        {levels.map((level: Level) => {
                          // Only show levels that have available slots
                          if (level.skills.length < level.newSkillCount) {
                            return (
                              <option 
                                key={level.id} 
                                value={`${level.id}|${level.skills.length}`}
                              >
                                {level.name} (Slot {level.skills.length + 1})
                              </option>
                            );
                          }
                          return null;
                        })}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        {hasChanges && (
          <button
            onClick={handleDiscardChanges}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md transition-colors"
          >
            Discard Changes
          </button>
        )}
        <button
          onClick={handleSaveSkillTree}
          disabled={isSaving || !hasChanges}
          className={`px-6 py-3 font-semibold rounded-md transition-colors ${
            hasChanges 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Skill Tree'}
        </button>
      </div>
    </div>
  );
} 