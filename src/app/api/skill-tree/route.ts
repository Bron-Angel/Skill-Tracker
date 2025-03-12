import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/jsonDb';
import fs from 'fs/promises';
import path from 'path';

// Mark this route as dynamic to prevent static optimization errors
export const dynamic = 'force-dynamic';

// Define the data directory and file for user skill tree configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const USER_SKILL_TREE_CONFIG_FILE = path.join(DATA_DIR, 'userSkillTreeConfig.json');

// Define the UserSkillTreeConfig type
interface UserSkillTreeConfig {
  id: string;
  userId: string;
  levelId: string;
  skillId: string;
  position: number;
}

// Helper function to read user skill tree config
async function readUserSkillTreeConfig(): Promise<UserSkillTreeConfig[]> {
  try {
    console.log('Reading from file:', USER_SKILL_TREE_CONFIG_FILE);
    
    // Check if the file exists
    try {
      await fs.access(USER_SKILL_TREE_CONFIG_FILE);
    } catch (error) {
      console.log('File does not exist, creating it with empty array');
      // If file doesn't exist, create it with empty array
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(USER_SKILL_TREE_CONFIG_FILE, '[]');
      return [];
    }
    
    // Read the file content
    const data = await fs.readFile(USER_SKILL_TREE_CONFIG_FILE, 'utf-8');
    console.log('File content:', data);
    
    // Try to parse the JSON
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      // If the file contains invalid JSON, reset it with an empty array
      await fs.writeFile(USER_SKILL_TREE_CONFIG_FILE, '[]');
      return [];
    }
  } catch (error) {
    console.error('Error reading user skill tree config:', error);
    throw error;
  }
}

// Helper function to write user skill tree config
async function writeUserSkillTreeConfig(data: UserSkillTreeConfig[]): Promise<void> {
  try {
    console.log('Writing to file:', USER_SKILL_TREE_CONFIG_FILE);
    console.log('Data to write:', JSON.stringify(data, null, 2));
    
    // Ensure the data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Write the data to the file
    await fs.writeFile(USER_SKILL_TREE_CONFIG_FILE, JSON.stringify(data, null, 2));
    
    // Verify the file was written correctly
    const fileContent = await fs.readFile(USER_SKILL_TREE_CONFIG_FILE, 'utf-8');
    console.log('File content after write:', fileContent);
    
    // Try to parse the JSON to ensure it's valid
    try {
      JSON.parse(fileContent);
      console.log('File contains valid JSON');
    } catch (error) {
      console.error('File contains invalid JSON:', error);
      throw new Error('Failed to write valid JSON to file');
    }
  } catch (error) {
    console.error('Error writing user skill tree config:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = session.user.name;

    // Get user data
    const user = await db.user.findUnique({
      username,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all levels
    const levels = await db.level.findMany();

    // Get all skills
    const skills = await db.skill.findMany();

    // Get user's skill tree configuration
    const userSkillTreeConfig = await readUserSkillTreeConfig();
    const userConfigs = userSkillTreeConfig.filter(config => config.userId === user.id);

    console.log('User configs:', userConfigs);

    // Prepare levels with assigned skills
    const levelsWithSkills = levels.map((level) => {
      const levelSkills = userConfigs
        .filter((config) => config.levelId === level.id)
        .sort((a, b) => a.position - b.position)
        .map((config) => {
          const skill = skills.find(s => s.id === config.skillId);
          if (!skill) return null;
          
          return {
            id: skill.id,
            name: skill.name,
            experienceNeeded: skill.experienceNeeded,
            emoji: skill.emoji || '❓',
            isUnlocked: user.experience >= skill.experienceNeeded,
          };
        })
        .filter(Boolean); // Remove null values

      return {
        id: level.id,
        name: level.name,
        experienceNeeded: level.experienceNeeded,
        newSkillCount: level.newSkillCount,
        skills: levelSkills,
      };
    });

    // Get unassigned skills
    const assignedSkillIds = userConfigs.map((config) => config.skillId);
    const unassignedSkills = skills
      .filter((skill) => !assignedSkillIds.includes(skill.id))
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        experienceNeeded: skill.experienceNeeded,
        emoji: skill.emoji || '❓',
        isUnlocked: user.experience >= skill.experienceNeeded,
      }));

    return NextResponse.json({
      levels: levelsWithSkills,
      unassignedSkills,
    });
  } catch (error) {
    console.error('Error fetching skill tree data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = session.user.name;
    console.log('Session user:', session.user);
    console.log('Username:', username);

    const body = await request.json();
    const { skillTreeConfig } = body;

    console.log('Received skill tree config:', skillTreeConfig);

    if (!Array.isArray(skillTreeConfig)) {
      return NextResponse.json({ error: 'Invalid skill tree configuration' }, { status: 400 });
    }

    // Get user data
    const user = await db.user.findUnique({
      username,
    });

    console.log('User from database:', user);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Read existing skill tree configuration
    const allConfigs = await readUserSkillTreeConfig();
    console.log('Existing configs:', allConfigs);
    
    // Remove existing user configs
    const otherUserConfigs = allConfigs.filter(config => config.userId !== user.id);
    console.log('Other user configs:', otherUserConfigs);
    
    // Create new skill tree configuration
    const newConfigs = [];
    for (const config of skillTreeConfig) {
      const { levelId, skillId, position } = config;
      
      if (!levelId || !skillId || typeof position !== 'number') {
        console.warn('Invalid config entry:', config);
        continue;
      }

      const newConfig = {
        id: Math.random().toString(36).substring(2, 15),
        userId: user.id,
        levelId,
        skillId,
        position,
      };

      newConfigs.push(newConfig);
    }

    console.log('New configs to save:', newConfigs);
    console.log('Final configs to save:', [...otherUserConfigs, ...newConfigs]);

    // Save all configs
    await writeUserSkillTreeConfig([...otherUserConfigs, ...newConfigs]);

    return NextResponse.json({
      success: true,
      message: 'Skill tree configuration saved successfully',
      configs: newConfigs,
    });
  } catch (error) {
    console.error('Error saving skill tree configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 