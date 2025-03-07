import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { db } from '@/lib/jsonDb';

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

export async function GET() {
  try {
    // Get the admin user
    const adminUser = await db.user.findUnique({
      username: 'admin',
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Get all levels
    const levels = await db.level.findMany();
    
    // Get all skills
    const skills = await db.skill.findMany();
    
    if (levels.length === 0 || skills.length === 0) {
      return NextResponse.json({ error: 'No levels or skills found' }, { status: 404 });
    }
    
    // Create a test skill tree configuration
    const skillTreeConfig = [
      {
        id: Math.random().toString(36).substring(2, 15),
        userId: adminUser.id,
        levelId: levels[0].id, // Level 1
        skillId: skills[0].id, // First skill
        position: 0,
      },
      {
        id: Math.random().toString(36).substring(2, 15),
        userId: adminUser.id,
        levelId: levels[0].id, // Level 1
        skillId: skills[1].id, // Second skill
        position: 1,
      },
      {
        id: Math.random().toString(36).substring(2, 15),
        userId: adminUser.id,
        levelId: levels[1].id, // Level 2
        skillId: skills[2].id, // Third skill
        position: 0,
      },
    ];
    
    // Ensure the data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Write the test configuration to the file
    await fs.writeFile(USER_SKILL_TREE_CONFIG_FILE, JSON.stringify(skillTreeConfig, null, 2));
    
    // Verify the file was written correctly
    const fileContent = await fs.readFile(USER_SKILL_TREE_CONFIG_FILE, 'utf-8');
    
    return NextResponse.json({
      success: true,
      message: 'Test skill tree configuration saved successfully',
      skillTreeConfig,
      fileContent: JSON.parse(fileContent),
    });
  } catch (error) {
    console.error('Error saving test skill tree configuration:', error);
    return NextResponse.json({
      error: 'Failed to save test skill tree configuration',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
} 