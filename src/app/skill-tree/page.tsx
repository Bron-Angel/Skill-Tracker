"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SkillItem } from "@/components/SkillItem";
import { SortableSkillItem } from "@/components/SortableSkillItem";

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

// Keep track of which container an item belongs to
type ItemsMap = Record<UniqueIdentifier, string>;

// Add a new component for a draggable but not sortable skill item
function DraggableSkillItem({ id, skill }: { id: string; skill: Skill }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="border border-gray-200 rounded-md p-3 bg-white cursor-grab touch-none"
      id={id}
      data-container="unassigned"
    >
      <SkillItem
        name={skill.name}
        emoji={skill.emoji}
        experienceNeeded={skill.experienceNeeded}
        isUnlocked={skill.isUnlocked}
        isDraggable={true}
      />
    </div>
  );
}

// Add this component for droppable level containers
function DroppableLevelContainer({
  id,
  levelId,
  children,
}: {
  id: string;
  levelId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: "level-container",
      levelId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 min-h-[120px] bg-gray-50 p-4 rounded-md"
      id={id}
      data-level-id={levelId}
      data-is-level-container="true"
    >
      {children}
    </div>
  );
}

// Add this component for droppable unassigned container
function DroppableUnassignedContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: "unassigned-container",
    data: {
      type: "unassigned-container",
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="grid grid-cols-1 gap-4 min-h-[300px] bg-gray-50 p-4 rounded-md"
      id="unassigned-container"
      data-is-unassigned-container="true"
    >
      {children}
    </div>
  );
}

// Add a component for skill items with remove button
function RemovableSkillItem({
  id,
  skill,
  containerId,
  onRemove,
}: {
  id: string;
  skill: Skill;
  containerId: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative border border-gray-200 rounded-md p-3 bg-white">
      <button
        onClick={onRemove}
        className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 shadow-md"
        aria-label="Remove skill"
      >
        ×
      </button>
      <SkillItem
        name={skill.name}
        emoji={skill.emoji}
        experienceNeeded={skill.experienceNeeded}
        isUnlocked={skill.isUnlocked}
        isDraggable={false}
      />
    </div>
  );
}

export default function SkillTreePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [levels, setLevels] = useState<Level[]>([]);
  const [unassignedSkills, setUnassignedSkills] = useState<Skill[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [itemsMap, setItemsMap] = useState<ItemsMap>({});
  const [currentContainer, setCurrentContainer] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sortingMode, setSortingMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchSkillTreeData();
    }
  }, [status, router]);

  // Update the items map whenever levels or unassigned skills change
  useEffect(() => {
    const newItemsMap: ItemsMap = {};

    // Add unassigned skills to the map
    unassignedSkills.forEach((skill) => {
      newItemsMap[skill.id] = "unassigned";
    });

    // Add level skills to the map
    levels.forEach((level) => {
      level.skills.forEach((skill) => {
        newItemsMap[skill.id] = `level-${level.id}`;
      });
    });

    setItemsMap(newItemsMap);
  }, [levels, unassignedSkills]);

  // Add/remove dragging class to body
  useEffect(() => {
    if (isDragging) {
      document.body.classList.add("dragging");
    } else {
      document.body.classList.remove("dragging");
    }

    return () => {
      document.body.classList.remove("dragging");
    };
  }, [isDragging]);

  const fetchSkillTreeData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/skill-tree");
      if (!response.ok) {
        throw new Error("Failed to fetch skill tree data");
      }
      const data = await response.json();
      console.log("Fetched skill tree data:", data);
      setLevels(data.levels);
      setUnassignedSkills(data.unassignedSkills);
    } catch (err) {
      console.error("Error fetching skill tree data:", err);
      setError("Failed to load skill tree data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    setActiveId(id);
    setIsDragging(true);

    // Find the container the item belongs to
    // Try to get container from element's data attribute first
    const element = document.getElementById(id.toString());
    let container = element?.getAttribute("data-container");

    // If not found in attribute, use the itemsMap
    if (!container) {
      container = itemsMap[id];
    }

    setCurrentContainer(container);

    // Find the skill being dragged
    let draggedSkill: Skill | null = null;

    // Check in unassigned skills
    draggedSkill = unassignedSkills.find((skill) => skill.id === id) || null;

    // If not found, check in levels
    if (!draggedSkill) {
      for (const level of levels) {
        draggedSkill = level.skills.find((skill) => skill.id === id) || null;
        if (draggedSkill) break;
      }
    }

    setActiveSkill(draggedSkill);
    console.log("Drag started:", { id, container, draggedSkill });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log("Drag over detailed:", {
      activeId,
      overId,
      activeData: active.data.current,
      overData: over.data.current,
    });

    // Improved container detection using data attributes or dnd-kit's data
    let activeContainer = null;
    if (active.data.current?.containerId) {
      activeContainer = active.data.current.containerId;
    } else {
      activeContainer = itemsMap[activeId];
    }

    // Detect over container
    let overContainer = null;
    if (over.data.current?.type === "level-container") {
      overContainer = `level-${over.data.current.levelId}`;
    } else if (
      over.data.current?.type === "unassigned-container" ||
      over.id === "unassigned-container"
    ) {
      overContainer = "unassigned";
    } else {
      overContainer = itemsMap[overId];
    }

    console.log("Container detection:", { activeContainer, overContainer });

    // If we're in sorting mode and trying to move between containers, prevent it
    if (sortingMode && activeContainer !== overContainer) {
      console.log("Preventing cross-container drag in sorting mode");
      return;
    }

    // Moving to a different container
    if (activeContainer !== overContainer) {
      // Check if the level has space for more skills
      if (overContainer?.startsWith("level-")) {
        const levelId = overContainer.replace("level-", "");
        const levelIndex = levels.findIndex((level) => level.id === levelId);

        if (
          levelIndex !== -1 &&
          levels[levelIndex].skills.length >= levels[levelIndex].newSkillCount
        ) {
          setError(
            `Level ${levels[levelIndex].name} is full. Remove a skill first.`
          );
          return;
        }
      }

      setError("");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveSkill(null);
    setCurrentContainer(null);
    setIsDragging(false);

    if (!over) {
      console.log("No over target, drag cancelled");
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log("Drag end:", {
      activeId,
      overId,
      activeData: active.data.current,
      overData: over.data.current,
    });

    // Improved container detection
    let activeContainer = null;
    if (active.data.current?.containerId) {
      activeContainer = active.data.current.containerId;
    } else {
      activeContainer = itemsMap[activeId];
    }

    // Detect over container
    let overContainer = null;
    let overIndex = -1;

    if (over.data.current?.type === "level-container") {
      overContainer = `level-${over.data.current.levelId}`;
      const levelId = over.data.current.levelId;
      const levelIndex = levels.findIndex((level) => level.id === levelId);
      if (levelIndex !== -1) {
        overIndex = levels[levelIndex].skills.length; // Add to the end
      }
    } else if (
      over.data.current?.type === "unassigned-container" ||
      over.id === "unassigned-container"
    ) {
      overContainer = "unassigned";
      overIndex = unassignedSkills.length; // Add to the end
    } else {
      overContainer = itemsMap[overId];
      // Find the index if dropping on an item
      if (overContainer === "unassigned") {
        overIndex = unassignedSkills.findIndex((skill) => skill.id === overId);
      } else if (overContainer?.startsWith("level-")) {
        const levelId = overContainer.replace("level-", "");
        const levelIndex = levels.findIndex((level) => level.id === levelId);
        if (levelIndex !== -1) {
          overIndex = levels[levelIndex].skills.findIndex(
            (skill) => skill.id === overId
          );
        }
      }
    }

    console.log("Containers detected:", {
      activeContainer,
      overContainer,
      overIndex,
    });

    if (!activeContainer || !overContainer) {
      console.log("Container not found, drag cancelled");
      return;
    }

    // If we're in sorting mode and trying to move between containers, prevent it
    if (sortingMode && activeContainer !== overContainer) {
      console.log("Sorting mode is on, cannot move between containers");
      return;
    }

    // Find the skill being moved
    let skill: Skill | null = null;
    let sourceIndex = -1;

    if (activeContainer === "unassigned") {
      sourceIndex = unassignedSkills.findIndex((s) => s.id === activeId);
      if (sourceIndex !== -1) {
        skill = unassignedSkills[sourceIndex];
      }
    } else if (activeContainer.startsWith("level-")) {
      const levelId = activeContainer.replace("level-", "");
      const levelIndex = levels.findIndex((level) => level.id === levelId);

      if (levelIndex !== -1) {
        sourceIndex = levels[levelIndex].skills.findIndex(
          (s) => s.id === activeId
        );
        if (sourceIndex !== -1) {
          skill = levels[levelIndex].skills[sourceIndex];
        }
      }
    }

    if (!skill) {
      console.log("Skill not found, drag cancelled");
      return;
    }

    console.log("Moving skill:", { skill, sourceIndex, overIndex });

    // Moving within the same container
    if (activeContainer === overContainer) {
      if (
        activeContainer === "unassigned" &&
        sourceIndex !== -1 &&
        overIndex !== -1
      ) {
        setUnassignedSkills(
          arrayMove(unassignedSkills, sourceIndex, overIndex)
        );
      } else if (activeContainer.startsWith("level-")) {
        const levelId = activeContainer.replace("level-", "");
        const levelIndex = levels.findIndex((level) => level.id === levelId);

        if (levelIndex !== -1 && sourceIndex !== -1 && overIndex !== -1) {
          const newLevels = [...levels];
          newLevels[levelIndex].skills = arrayMove(
            newLevels[levelIndex].skills,
            sourceIndex,
            overIndex
          );
          setLevels(newLevels);
        }
      }
    } else {
      // Moving to a different container
      // Remove from source container
      if (activeContainer === "unassigned") {
        setUnassignedSkills(unassignedSkills.filter((s) => s.id !== activeId));
      } else if (activeContainer.startsWith("level-")) {
        const levelId = activeContainer.replace("level-", "");
        const levelIndex = levels.findIndex((level) => level.id === levelId);

        if (levelIndex !== -1) {
          const newLevels = [...levels];
          newLevels[levelIndex].skills = newLevels[levelIndex].skills.filter(
            (s) => s.id !== activeId
          );
          setLevels(newLevels);
        }
      }

      // Add to target container
      if (overContainer === "unassigned") {
        const newUnassignedSkills = [...unassignedSkills];

        if (overIndex === -1 || overIndex >= newUnassignedSkills.length) {
          newUnassignedSkills.push(skill);
        } else {
          newUnassignedSkills.splice(overIndex, 0, skill);
        }

        setUnassignedSkills(newUnassignedSkills);
      } else if (overContainer.startsWith("level-")) {
        const levelId = overContainer.replace("level-", "");
        const levelIndex = levels.findIndex((level) => level.id === levelId);

        if (levelIndex !== -1) {
          // Check if the level has space for more skills
          if (
            levels[levelIndex].skills.length >= levels[levelIndex].newSkillCount
          ) {
            setError(
              `Level ${levels[levelIndex].name} is full. Remove a skill first.`
            );

            // Put the skill back to its original container
            if (activeContainer === "unassigned") {
              setUnassignedSkills([...unassignedSkills, skill]);
            } else if (activeContainer.startsWith("level-")) {
              const sourceLevelId = activeContainer.replace("level-", "");
              const sourceLevelIndex = levels.findIndex(
                (level) => level.id === sourceLevelId
              );

              if (sourceLevelIndex !== -1) {
                const newLevels = [...levels];
                newLevels[sourceLevelIndex].skills.splice(
                  sourceIndex,
                  0,
                  skill
                );
                setLevels(newLevels);
              }
            }

            return;
          }

          const newLevels = [...levels];

          if (
            overIndex === -1 ||
            overIndex >= newLevels[levelIndex].skills.length
          ) {
            newLevels[levelIndex].skills.push(skill);
          } else {
            newLevels[levelIndex].skills.splice(overIndex, 0, skill);
          }

          setLevels(newLevels);
        }
      }
    }

    // Automatically save the skill tree after a successful drag-and-drop operation
    setTimeout(() => {
      handleSaveSkillTree();
    }, 500);
  };

  const findContainer = (id: string) => {
    return itemsMap[id] || null;
  };

  const handleSaveSkillTree = async () => {
    setIsSaving(true);
    setError("");
    setSaveSuccess(false);

    try {
      const skillTreeConfig = levels.flatMap((level) =>
        level.skills.map((skill, index) => ({
          levelId: level.id,
          skillId: skill.id,
          position: index,
        }))
      );

      console.log("Saving skill tree config:", skillTreeConfig);

      // Don't save if there are no skills to save
      if (skillTreeConfig.length === 0) {
        console.log("No skills to save, skipping API call");
        setSaveSuccess(true);
        return;
      }

      const response = await fetch("/api/skill-tree", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skillTreeConfig }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save skill tree");
      }

      const result = await response.json();
      console.log("Save result:", result);
      setSaveSuccess(true);

      // Refresh the data after saving
      await fetchSkillTreeData();
    } catch (err) {
      console.error("Error saving skill tree:", err);
      setError("Failed to save your skill tree. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add a new function to handle removing items from levels
  const handleRemoveFromLevel = (levelId: string, skillId: string) => {
    const levelIndex = levels.findIndex((level) => level.id === levelId);
    if (levelIndex === -1) return;

    // Get the skill before removing it
    const skill = levels[levelIndex].skills.find((s) => s.id === skillId);
    if (!skill) return;

    // Create new levels array without the skill
    const newLevels = [...levels];
    newLevels[levelIndex].skills = newLevels[levelIndex].skills.filter(
      (s) => s.id !== skillId
    );
    setLevels(newLevels);

    // Add to unassigned
    setUnassignedSkills([...unassignedSkills, skill]);

    // Save changes
    setTimeout(() => {
      handleSaveSkillTree();
    }, 500);
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
      <h1 className="text-2xl font-bold mb-6 text-center">
        Skill Tree Builder
      </h1>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <p className="text-gray-700">
          Drag and drop skills to assign them to different levels. Each level
          has a limited number of skill slots. Your progress will be tracked
          based on this configuration.
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-3/4">
            <div
              className="bg-white p-6 rounded-lg shadow-md"
              data-is-droppable="true"
            >
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
                          {level.skills.length}/{level.newSkillCount} skills •{" "}
                          {level.experienceNeeded} XP needed
                        </span>
                      </div>

                      <SortableContext
                        items={level.skills.map((skill) => skill.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        <DroppableLevelContainer
                          id={`level-container-${level.id}`}
                          levelId={level.id}
                        >
                          {level.skills.map((skill) =>
                            // Here we show either sortable items or removable items
                            sortingMode ? (
                              <SortableSkillItem
                                key={skill.id}
                                id={skill.id}
                                skill={skill}
                                containerId={`level-${level.id}`}
                              />
                            ) : (
                              <RemovableSkillItem
                                key={skill.id}
                                id={skill.id}
                                skill={skill}
                                containerId={`level-${level.id}`}
                                onRemove={() =>
                                  handleRemoveFromLevel(level.id, skill.id)
                                }
                              />
                            )
                          )}
                          {level.skills.length === 0 && (
                            <div
                              className="min-h-[80px] border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center"
                              id={`level-placeholder-${level.id}`}
                              data-level-id={level.id}
                            >
                              <span className="text-gray-400">
                                Drop skills here
                              </span>
                            </div>
                          )}
                        </DroppableLevelContainer>
                      </SortableContext>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:w-1/4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Unassigned Skills</h2>

                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">
                    Sorting mode
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={sortingMode}
                      onChange={() => setSortingMode(!sortingMode)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {sortingMode ? (
                <div className="mb-2 px-3 py-2 bg-blue-100 text-blue-800 rounded text-sm">
                  Sorting mode ON - Skills can only be reordered within
                  unassigned
                </div>
              ) : (
                <div className="mb-2 px-3 py-2 bg-green-100 text-green-800 rounded text-sm">
                  Drag mode ON - Drag skills to assign them to levels
                </div>
              )}

              {/* Conditionally apply SortableContext based on sorting mode */}
              {sortingMode ? (
                <SortableContext
                  items={unassignedSkills.map((skill) => skill.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className="grid grid-cols-1 gap-4 min-h-[300px] bg-gray-50 p-4 rounded-md"
                    id="unassigned-container"
                    data-is-unassigned-container="true"
                  >
                    {unassignedSkills.map((skill) => (
                      <SortableSkillItem
                        key={skill.id}
                        id={skill.id}
                        skill={skill}
                        containerId="unassigned"
                      />
                    ))}
                    {unassignedSkills.length === 0 && (
                      <div
                        className="min-h-[80px] border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center"
                        id="unassigned-placeholder"
                      >
                        <span className="text-gray-400">Drop skills here</span>
                      </div>
                    )}
                  </div>
                </SortableContext>
              ) : (
                <DroppableUnassignedContainer>
                  {unassignedSkills.map((skill) => (
                    <DraggableSkillItem
                      key={skill.id}
                      id={skill.id}
                      skill={skill}
                    />
                  ))}
                  {unassignedSkills.length === 0 && (
                    <div
                      className="min-h-[80px] border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center"
                      id="unassigned-placeholder"
                    >
                      <span className="text-gray-400">Drop skills here</span>
                    </div>
                  )}
                </DroppableUnassignedContainer>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId && activeSkill ? (
            <div className="bg-white rounded-md shadow-sm opacity-80">
              <SkillItem
                name={activeSkill.name}
                emoji={activeSkill.emoji}
                experienceNeeded={activeSkill.experienceNeeded}
                isUnlocked={activeSkill.isUnlocked}
                isDraggable={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSaveSkillTree}
          disabled={isSaving}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Skill Tree"}
        </button>
      </div>
    </div>
  );
}
