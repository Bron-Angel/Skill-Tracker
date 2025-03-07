import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the data directory and file for user skill tree configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const USER_SKILL_TREE_CONFIG_FILE = path.join(DATA_DIR, 'userSkillTreeConfig.json');

export async function POST() {
  try {
    // Ensure the data directory exists
    try {
      await fs.access(DATA_DIR);
    } catch (error) {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }

    // Reset the file with an empty array
    await fs.writeFile(USER_SKILL_TREE_CONFIG_FILE, '[]');
    
    // Verify the file was reset correctly
    const data = await fs.readFile(USER_SKILL_TREE_CONFIG_FILE, 'utf-8');
    
    return NextResponse.json({
      success: true,
      message: 'File reset successfully',
      content: data
    });
  } catch (error) {
    console.error('Error resetting file:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to reset file',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}