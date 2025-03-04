'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { SkillItem } from '@/components/SkillItem';

interface Skill {
  id: string;
  name: string;
  experienceNeeded: number;
  imageUrl: string;
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
  const [error, setError] = useState('');
  const [levels, setLevels] = useState<Level[]>([]);
  const [unassignedSkills, setUnassignedSkills] = useState<Skill[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchSkillTreeData();
    }
  }, [status, router]);

  const fetchSkillTreeData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/skill-tree');
      if (!response.ok) {
        throw new Error('Failed to fetch skill tree data');
      }
      const data = await response.json();
      setLevels(data.levels);
      setUnassignedSkills(data.unassignedSkills);
    } catch (err) {
      setError('Failed to load skill tree data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = (result: any) => {
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Moving within unassigned skills
    if (source.droppableId === 'unassigned' && destination.droppableId === 'unassigned') {
      const newUnassignedSkills = Array.from(unassignedSkills);
      const [movedSkill] = newUnassignedSkills.splice(source.index, 1);
      newUnassignedSkills.splice(destination.index, 0, movedSkill);
      setUnassignedSkills(newUnassignedSkills);
      return;
    }

    // Moving from unassigned to a level
    if (source.droppableId === 'unassigned' && destination.droppableId.startsWith('level-')) {
      const levelId = destination.droppableId.replace('level-', '');
      const levelIndex = levels.findIndex((level) => level.id === levelId);
      
      if (levelIndex === -1) return;
      
      // Check if the level has space for more skills
      if (levels[levelIndex].skills.length >= levels[levelIndex].newSkillCount) {
        setError(`Level ${levels[levelIndex].name} is full. Remove a skill first.`);
        return;
      }

      const newUnassignedSkills = Array.from(unassignedSkills);
      const [movedSkill] = newUnassignedSkills.splice(source.index, 1);
      
      const newLevels = Array.from(levels);
      newLevels[levelIndex].skills.splice(destination.index, 0, movedSkill);
      
      setUnassignedSkills(newUnassignedSkills);
      setLevels(newLevels);
      return;
    }

    // Moving from a level to unassigned
    if (source.droppableId.startsWith('level-') && destination.droppableId === 'unassigned') {
      const levelId = source.droppableId.replace('level-', '');
      const levelIndex = levels.findIndex((level) => level.id === levelId);
      
      if (levelIndex === -1) return;
      
      const newLevels = Array.from(levels);
      const [movedSkill] = newLevels[levelIndex].skills.splice(source.index, 1);
      
      const newUnassignedSkills = Array.from(unassignedSkills);
      newUnassignedSkills.splice(destination.index, 0, movedSkill);
      
      setLevels(newLevels);
      setUnassignedSkills(newUnassignedSkills);
      return;
    }

    // Moving from one level to another
    if (source.droppableId.startsWith('level-') && destination.droppableId.startsWith('level-')) {
      const sourceLevelId = source.droppableId.replace('level-', '');
      const destLevelId = destination.droppableId.replace('level-', '');
      
      const sourceLevelIndex = levels.findIndex((level) => level.id === sourceLevelId);
      const destLevelIndex = levels.findIndex((level) => level.id === destLevelId);
      
      if (sourceLevelIndex === -1 || destLevelIndex === -1) return;
      
      // Check if the destination level has space for more skills
      if (
        sourceLevelIndex !== destLevelIndex &&
        levels[destLevelIndex].skills.length >= levels[destLevelIndex].newSkillCount
      ) {
        setError(`Level ${levels[destLevelIndex].name} is full. Remove a skill first.`);
        return;
      }
      
      const newLevels = Array.from(levels);
      const [movedSkill] = newLevels[sourceLevelIndex].skills.splice(source.index, 1);
      
      newLevels[destLevelIndex].skills.splice(destination.index, 0, movedSkill);
      
      setLevels(newLevels);
      return;
    }
  };

  const handleSaveSkillTree = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const skillTreeConfig = levels.flatMap((level) =>
        level.skills.map((skill, index) => ({
          levelId: level.id,
          skillId: skill.id,
          position: index,
        }))
      );

      const response = await fetch('/api/skill-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillTreeConfig }),
      });

      if (!response.ok) {
        throw new Error('Failed to save skill tree');
      }

      setSaveSuccess(true);
    } catch (err) {
      setError('Failed to save your skill tree. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
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
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Skill Tree Builder</h1>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <p className="text-gray-700">
          Drag and drop skills to assign them to different levels. Each level has a limited number of skill slots.
          Your progress will be tracked based on this configuration.
        </p>
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-3/4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Levels</h2>
              
              {levels.length === 0 ? (
                <p className="text-gray-600">No levels available.</p>
              ) : (
                <div className="space-y-8">
                  {levels.map((level) => (
                    <div key={level.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">{level.name}</h3>
                        <span className="text-sm text-gray-600">
                          {level.skills.length}/{level.newSkillCount} skills • {level.experienceNeeded} XP needed
                        </span>
                      </div>
                      
                      <Droppable droppableId={`level-${level.id}`} direction="horizontal">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 min-h-[120px] bg-gray-50 p-4 rounded-md"
                          >
                            {level.skills.map((skill, index) => (
                              <Draggable key={skill.id} draggableId={skill.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <SkillItem
                                      name={skill.name}
                                      imageUrl={skill.imageUrl}
                                      experienceNeeded={skill.experienceNeeded}
                                      isUnlocked={skill.isUnlocked}
                                      isDraggable={true}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:w-1/4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Unassigned Skills</h2>
              
              <Droppable droppableId="unassigned">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-1 gap-4 min-h-[300px] bg-gray-50 p-4 rounded-md"
                  >
                    {unassignedSkills.map((skill, index) => (
                      <Draggable key={skill.id} draggableId={skill.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <SkillItem
                              name={skill.name}
                              imageUrl={skill.imageUrl}
                              experienceNeeded={skill.experienceNeeded}
                              isUnlocked={skill.isUnlocked}
                              isDraggable={true}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </div>
      </DragDropContext>

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSaveSkillTree}
          disabled={isSaving}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Skill Tree'}
        </button>
      </div>
    </div>
  );
} 