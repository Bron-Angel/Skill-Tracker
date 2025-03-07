import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/jsonDb';
import fs from 'fs/promises';
import path from 'path';

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

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = session.user.name;
    console.log('Session user:', session.user);
    console.log('Username:', username);

    // Get user data
    const user = await db.user.findUnique({
      username,
    });

    console.log('User from database:', user);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all skills from the database
    const allSkills = await db.skill.findMany();
    console.log('All skills:', allSkills);
    
    // Get all levels
    const levels = await db.level.findMany();
    console.log('All levels:', levels);
    
    // Get user's skill tree configuration
    const userSkillTreeConfig = await readUserSkillTreeConfig();
    console.log('All skill tree configs:', userSkillTreeConfig);
    
    const userConfigs = userSkillTreeConfig.filter(config => config.userId === user.id);
    console.log('User configs for skills:', userConfigs);
    
    // Get the levels that the user has unlocked based on experience
    const unlockedLevelIds = levels
      .filter(level => user.experience >= level.experienceNeeded)
      .map(level => level.id);
    
    console.log('Unlocked level IDs:', unlockedLevelIds);
    
    // Get skills that are assigned to unlocked levels
    const unlockedSkillIds = userConfigs
      .filter(config => unlockedLevelIds.includes(config.levelId))
      .map(config => config.skillId);
    
    console.log('Unlocked skill IDs:', unlockedSkillIds);
    
    // Map all skills with unlocked status
    const skills = allSkills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      experienceNeeded: skill.experienceNeeded,
      emoji: skill.emoji || '❓',
      isUnlocked: unlockedSkillIds.includes(skill.id) || user.experience >= skill.experienceNeeded,
    }));

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 