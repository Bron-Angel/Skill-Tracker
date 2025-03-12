import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/jsonDb';
import fs from 'fs/promises';
import path from 'path';

// Mark this route as dynamic to prevent static optimization errors
export const dynamic = 'force-dynamic';

// Helper function to read user experience data
async function readUserExperience(username: string): Promise<{ level: number, experience: number }> {
  try {
    const userDataPath = path.join(process.cwd(), 'data', 'users', `${username}.json`);
    const userData = await fs.readFile(userDataPath, 'utf-8');
    const user = JSON.parse(userData);
    return { 
      level: user.level || 1, 
      experience: user.experience || 0 
    };
  } catch (error) {
    console.error('Error reading user experience:', error);
    return { level: 1, experience: 0 };
  }
}

// Helper function to write user experience data
async function writeUserExperience(username: string, level: number, experience: number): Promise<void> {
  try {
    const userDataPath = path.join(process.cwd(), 'data', 'users', `${username}.json`);
    
    // Ensure the user data file exists
    try {
      await fs.access(userDataPath);
    } catch {
      // Create a new user data file if it doesn't exist
      const userDir = path.join(process.cwd(), 'data', 'users');
      await fs.mkdir(userDir, { recursive: true });
    }
    
    // Read existing user data or create new data
    let userData = {};
    try {
      const existingData = await fs.readFile(userDataPath, 'utf-8');
      userData = JSON.parse(existingData);
    } catch {
      // If file doesn't exist or can't be parsed, create new data
      userData = { username };
    }
    
    // Update experience and level
    userData = {
      ...userData,
      level,
      experience,
    };
    
    // Write updated user data
    await fs.writeFile(userDataPath, JSON.stringify(userData, null, 2));
  } catch (error) {
    console.error('Error writing user experience:', error);
    throw new Error('Failed to update user experience');
  }
}

// Helper function to calculate cumulative experience for skills within a level
function calculateCumulativeSkillExperience(skills: any[], levelStartExperience: number) {
  let cumulativeExp = levelStartExperience;
  return skills.map(skill => {
    const skillWithCumulativeExp = {
      ...skill,
      cumulativeExperienceNeeded: cumulativeExp + skill.experienceNeeded
    };
    cumulativeExp = skillWithCumulativeExp.cumulativeExperienceNeeded;
    return skillWithCumulativeExp;
  });
}

// Define the UserSkillTreeConfig type
interface UserSkillTreeConfig {
  id: string;
  userId: string;
  levelId: string;
  skillId: string;
  position: number;
}

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = session.user.name;

    // Get user data
    const userData = await readUserExperience(username);
    const { level: currentLevel, experience: currentExperience } = userData;

    // Get all levels
    const levels = await db.level.findMany();
    
    // Sort levels by their number
    const sortedLevels = levels.sort((a, b) => {
      const aNumber = parseInt(a.name.split(' ').pop() || '0', 10);
      const bNumber = parseInt(b.name.split(' ').pop() || '0', 10);
      return aNumber - bNumber;
    });

    // Calculate cumulative experience needed for each level
    const levelsWithCumulativeExp = calculateCumulativeExperience(sortedLevels);

    // Get all skills
    const allSkills = await db.skill.findMany();

    // Get user's skill tree configuration
    // Read from the userSkillTreeConfig.json file
    const userSkillTreeConfigPath = path.join(process.cwd(), 'data', 'userSkillTreeConfig.json');
    let userSkillTreeConfig: UserSkillTreeConfig[] = [];
    
    try {
      const configData = await fs.readFile(userSkillTreeConfigPath, 'utf-8');
      userSkillTreeConfig = JSON.parse(configData);
    } catch (error) {
      console.error('Error reading user skill tree config:', error);
      // If there's an error, continue with an empty config
    }

    // Get user ID
    const user = await db.user.findUnique({ username });
    const userId = user?.id;

    // Find the current level object based on cumulative experience
    const currentLevelObj = getCurrentLevel(levelsWithCumulativeExp, currentExperience);
    
    // Find the next level object
    let nextLevelObj = null;
    if (currentLevelObj) {
      const currentLevelIndex = levelsWithCumulativeExp.findIndex(level => level.id === currentLevelObj.id);
      if (currentLevelIndex < levelsWithCumulativeExp.length - 1) {
        nextLevelObj = levelsWithCumulativeExp[currentLevelIndex + 1];
      }
    } else if (levelsWithCumulativeExp.length > 0) {
      // If user hasn't reached any level yet, the next level is the first one
      nextLevelObj = levelsWithCumulativeExp[0];
    }
    
    // Calculate total experience needed for next level
    let totalExperienceForNextLevel = 0;
    if (nextLevelObj) {
      totalExperienceForNextLevel = nextLevelObj.cumulativeExperience;
    } else {
      totalExperienceForNextLevel = 999999; // Max level reached
    }
    
    // Calculate the experience range for the current level
    let currentLevelExperience = 0;
    if (currentLevelObj) {
      // The current level's starting experience is the cumulative experience of all previous levels
      const currentLevelIndex = levelsWithCumulativeExp.findIndex(level => level.id === currentLevelObj.id);
      
      if (currentLevelIndex === 0) {
        currentLevelExperience = 0;
      } else {
        currentLevelExperience = levelsWithCumulativeExp[currentLevelIndex - 1].cumulativeExperience;
      }
    }

    // Calculate the progress within the current level
    // This is the excess experience beyond what was needed for the current level
    let expInCurrentLevel = currentExperience - currentLevelExperience;
    
    // The experience needed for the next level is just the incremental amount
    let expNeededForNextLevel = nextLevelObj ? nextLevelObj.experienceNeeded : 999999;
    
    // Special case: If the user has exactly enough experience to complete the current level
    // (e.g., 10 XP for Level 1 where each level needs 10 XP), then they should be at the next level
    // with 0 progress toward the level after that
    if (currentLevelObj && currentExperience === currentLevelObj.cumulativeExperience) {
      // They're exactly at the boundary of the current level
      // Set progress to 0 for the next level
      expInCurrentLevel = 0;
    }
    
    // Special case: If the user has more experience than needed for the current level
    // but not enough for the next level, we need to adjust the calculation
    if (currentLevelObj && nextLevelObj && 
        currentExperience > currentLevelObj.cumulativeExperience && 
        currentExperience < nextLevelObj.cumulativeExperience) {
      // Calculate how much experience they have beyond the current level
      expInCurrentLevel = currentExperience - currentLevelObj.cumulativeExperience;
    }
    
    // Debug information
    console.log('Level progress calculation:', {
      currentExperience,
      currentLevelExperience,
      currentLevelCumulativeExperience: currentLevelObj?.cumulativeExperience,
      expInCurrentLevel,
      nextLevelExperienceNeeded: nextLevelObj?.experienceNeeded,
      expNeededForNextLevel,
      currentLevelName: currentLevelObj?.name,
      nextLevelName: nextLevelObj?.name,
      exactLevelBoundary: currentLevelObj && currentExperience === currentLevelObj.cumulativeExperience,
      beyondCurrentLevel: currentLevelObj && nextLevelObj && 
                         currentExperience > currentLevelObj.cumulativeExperience && 
                         currentExperience < nextLevelObj.cumulativeExperience
    });
    
    // Calculate the percentage of progress toward the next level
    let progressPercentage = 0;
    if (expNeededForNextLevel > 0) {
      progressPercentage = Math.min((expInCurrentLevel / expNeededForNextLevel) * 100, 100);
    }
    
    const levelProgress = {
      currentExp: currentExperience,
      levelStartExp: currentLevelExperience,
      levelEndExp: totalExperienceForNextLevel,
      expInCurrentLevel,
      expNeededForNextLevel,
      progressPercentage
    };

    // Get skills for the NEXT level (not the current level)
    const nextLevelSkills = [];
    
    if (userId && nextLevelObj) {
      // Filter user's skill tree config for the next level
      const nextLevelConfigs = userSkillTreeConfig.filter(
        (config: UserSkillTreeConfig) => config.userId === userId && config.levelId === nextLevelObj.id
      );
      
      // Sort configs by position to maintain the correct order
      const sortedConfigs = nextLevelConfigs.sort(
        (a: UserSkillTreeConfig, b: UserSkillTreeConfig) => a.position - b.position
      );
      
      // Get the skill IDs for the next level in the correct order
      const nextLevelSkillIds = sortedConfigs.map(config => config.skillId);
      
      // Find the skill data for each skill ID
      for (const skillId of nextLevelSkillIds) {
        const skillData = allSkills.find(s => s.id === skillId);
        if (skillData) {
          nextLevelSkills.push(skillData);
        }
      }
    }

    // Calculate the starting experience for the next level
    // This is the cumulative experience needed to reach the next level
    const nextLevelStartExperience = currentLevelObj ? 
      currentLevelObj.cumulativeExperience : 0;

    // Calculate cumulative experience for each skill
    const skillsWithCumulativeExp = calculateCumulativeSkillExperience(
      nextLevelSkills, 
      nextLevelStartExperience
    );

    // Create a single array of all skills with their unlocked status
    const skills = skillsWithCumulativeExp.map(skillData => ({
      id: skillData.id,
      name: skillData.name,
      experienceNeeded: skillData.experienceNeeded,
      cumulativeExperienceNeeded: skillData.cumulativeExperienceNeeded,
      emoji: skillData.emoji || '❓',
      isUnlocked: currentExperience >= skillData.cumulativeExperienceNeeded
    }));

    return NextResponse.json({
      level: currentLevelObj ? parseInt(currentLevelObj.name.split(' ').pop() || '0', 10) : 0,
      experience: currentExperience,
      totalExperienceForNextLevel,
      levelProgress,
      nextLevel: nextLevelObj ? parseInt(nextLevelObj.name.split(' ').pop() || '0', 10) : null,
      skills,
      // Keep these for backward compatibility
      unlockedSkills: skills.filter(skill => skill.isUnlocked),
      skillsToUnlock: skills.filter(skill => !skill.isUnlocked),
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate cumulative experience for each level
function calculateCumulativeExperience(levels: any[]) {
  let cumulativeExp = 0;
  return levels.map(level => {
    cumulativeExp += level.experienceNeeded;
    return {
      ...level,
      cumulativeExperience: cumulativeExp
    };
  });
}

// Helper function to get the current level based on experience
function getCurrentLevel(levelsWithCumulativeExp: any[], currentExperience: number) {
  // Find the highest level that the user has enough experience for
  let currentLevel = null;
  
  for (const level of levelsWithCumulativeExp) {
    if (currentExperience >= level.cumulativeExperience) {
      currentLevel = level;
    } else {
      break;
    }
  }
  
  return currentLevel;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = session.user.name;
    const { experiencePoints } = await request.json();

    if (typeof experiencePoints !== 'number') {
      return NextResponse.json({ error: 'Invalid experience points' }, { status: 400 });
    }

    // Get user data
    const userData = await readUserExperience(username);
    const { experience: currentExperience } = userData;

    // Get all levels
    const levels = await db.level.findMany();
    
    // Sort levels by their number
    const sortedLevels = levels.sort((a, b) => {
      const aNumber = parseInt(a.name.split(' ').pop() || '0', 10);
      const bNumber = parseInt(b.name.split(' ').pop() || '0', 10);
      return aNumber - bNumber;
    });

    // Calculate cumulative experience needed for each level
    const levelsWithCumulativeExp = calculateCumulativeExperience(sortedLevels);

    // Calculate new experience (ensure it doesn't go below 0)
    let newExperience = Math.max(0, currentExperience + experiencePoints);
    
    // Determine the new level based on cumulative experience
    const newLevelObj = getCurrentLevel(levelsWithCumulativeExp, newExperience);
    const newLevel = newLevelObj ? parseInt(newLevelObj.name.split(' ').pop() || '0', 10) : 0;

    // Find the next level object
    let nextLevelObj = null;
    if (newLevelObj) {
      const newLevelIndex = levelsWithCumulativeExp.findIndex(level => level.id === newLevelObj.id);
      if (newLevelIndex < levelsWithCumulativeExp.length - 1) {
        nextLevelObj = levelsWithCumulativeExp[newLevelIndex + 1];
      }
    } else if (levelsWithCumulativeExp.length > 0) {
      // If user hasn't reached any level yet, the next level is the first one
      nextLevelObj = levelsWithCumulativeExp[0];
    }

    // Get all skills
    const allSkills = await db.skill.findMany();

    // Get user's skill tree configuration
    // Read from the userSkillTreeConfig.json file
    const userSkillTreeConfigPath = path.join(process.cwd(), 'data', 'userSkillTreeConfig.json');
    let userSkillTreeConfig: UserSkillTreeConfig[] = [];
    
    try {
      const configData = await fs.readFile(userSkillTreeConfigPath, 'utf-8');
      userSkillTreeConfig = JSON.parse(configData);
    } catch (error) {
      console.error('Error reading user skill tree config:', error);
      // If there's an error, continue with an empty config
    }

    // Get user ID
    const user = await db.user.findUnique({ username });
    const userId = user?.id;

    // Update user data with cumulative experience
    await writeUserExperience(username, newLevel, newExperience);

    // Get skills for the NEXT level (not the current level)
    const nextLevelSkills = [];
    
    if (userId && nextLevelObj) {
      // Filter user's skill tree config for the next level
      const nextLevelConfigs = userSkillTreeConfig.filter(
        (config: UserSkillTreeConfig) => config.userId === userId && config.levelId === nextLevelObj.id
      );
      
      // Sort configs by position to maintain the correct order
      const sortedConfigs = nextLevelConfigs.sort(
        (a: UserSkillTreeConfig, b: UserSkillTreeConfig) => a.position - b.position
      );
      
      // Get the skill IDs for the next level in the correct order
      const nextLevelSkillIds = sortedConfigs.map(config => config.skillId);
      
      // Find the skill data for each skill ID
      for (const skillId of nextLevelSkillIds) {
        const skillData = allSkills.find(s => s.id === skillId);
        if (skillData) {
          nextLevelSkills.push(skillData);
        }
      }
    }

    // Calculate the starting experience for the next level
    // This is the cumulative experience needed to reach the next level
    const nextLevelStartExperience = newLevelObj ? 
      newLevelObj.cumulativeExperience : 0;

    // Calculate cumulative experience for each skill
    const skillsWithCumulativeExp = calculateCumulativeSkillExperience(
      nextLevelSkills, 
      nextLevelStartExperience
    );

    // Create a single array of all skills with their unlocked status
    const skills = skillsWithCumulativeExp.map(skillData => ({
      id: skillData.id,
      name: skillData.name,
      experienceNeeded: skillData.experienceNeeded,
      cumulativeExperienceNeeded: skillData.cumulativeExperienceNeeded,
      emoji: skillData.emoji || '❓',
      isUnlocked: newExperience >= skillData.cumulativeExperienceNeeded
    }));

    // Calculate total experience needed for next level
    let totalExperienceForNextLevel = 0;
    let currentLevelExperience = 0;
    
    // Find the next level based on cumulative experience
    const nextLevel = levelsWithCumulativeExp.find(level => level.cumulativeExperience > newExperience);
    
    if (nextLevel) {
      totalExperienceForNextLevel = nextLevel.cumulativeExperience;
    } else {
      totalExperienceForNextLevel = 999999; // Max level reached
    }

    // Calculate the experience range for the current level
    if (newLevelObj) {
      // The current level's starting experience is the cumulative experience of all previous levels
      const currentLevelIndex = levelsWithCumulativeExp.findIndex(level => level.id === newLevelObj.id);
      
      if (currentLevelIndex === 0) {
        currentLevelExperience = 0;
      } else {
        currentLevelExperience = levelsWithCumulativeExp[currentLevelIndex - 1].cumulativeExperience;
      }
    }

    // Calculate the progress within the current level
    // This is the excess experience beyond what was needed for the current level
    let expInCurrentLevel = newExperience - currentLevelExperience;
    
    // The experience needed for the next level is just the incremental amount
    let expNeededForNextLevel = nextLevelObj ? nextLevelObj.experienceNeeded : 999999;
    
    // Special case: If the user has exactly enough experience to complete the current level
    // (e.g., 10 XP for Level 1 where each level needs 10 XP), then they should be at the next level
    // with 0 progress toward the level after that
    if (newLevelObj && newExperience === newLevelObj.cumulativeExperience) {
      // They're exactly at the boundary of the current level
      // Set progress to 0 for the next level
      expInCurrentLevel = 0;
    }
    
    // Special case: If the user has more experience than needed for the current level
    // but not enough for the next level, we need to adjust the calculation
    if (newLevelObj && nextLevelObj && 
        newExperience > newLevelObj.cumulativeExperience && 
        newExperience < nextLevelObj.cumulativeExperience) {
      // Calculate how much experience they have beyond the current level
      expInCurrentLevel = newExperience - newLevelObj.cumulativeExperience;
    }
    
    // Debug information
    console.log('Level progress calculation (POST):', {
      newExperience,
      currentLevelExperience,
      currentLevelCumulativeExperience: newLevelObj?.cumulativeExperience,
      expInCurrentLevel,
      nextLevelExperienceNeeded: nextLevelObj?.experienceNeeded,
      expNeededForNextLevel,
      currentLevelName: newLevelObj?.name,
      nextLevelName: nextLevelObj?.name,
      exactLevelBoundary: newLevelObj && newExperience === newLevelObj.cumulativeExperience,
      beyondCurrentLevel: newLevelObj && nextLevelObj && 
                         newExperience > newLevelObj.cumulativeExperience && 
                         newExperience < nextLevelObj.cumulativeExperience
    });
    
    // Calculate the percentage of progress toward the next level
    let progressPercentage = 0;
    if (expNeededForNextLevel > 0) {
      progressPercentage = Math.min((expInCurrentLevel / expNeededForNextLevel) * 100, 100);
    }
    
    const levelProgress = {
      currentExp: newExperience,
      levelStartExp: currentLevelExperience,
      levelEndExp: totalExperienceForNextLevel,
      expInCurrentLevel,
      expNeededForNextLevel,
      progressPercentage
    };

    // Get the current level from user data for comparison
    const currentLevel = userData.level;

    return NextResponse.json({
      level: newLevel,
      experience: newExperience,
      totalExperienceForNextLevel,
      levelProgress,
      nextLevel: nextLevelObj ? parseInt(nextLevelObj.name.split(' ').pop() || '0', 10) : null,
      skills,
      // Keep these for backward compatibility
      unlockedSkills: skills.filter(skill => skill.isUnlocked),
      skillsToUnlock: skills.filter(skill => !skill.isUnlocked),
      leveledUp: newLevel > currentLevel,
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 