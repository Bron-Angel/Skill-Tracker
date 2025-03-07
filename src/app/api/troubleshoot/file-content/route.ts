import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the data directory and file for user skill tree configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const USER_SKILL_TREE_CONFIG_FILE = path.join(DATA_DIR, 'userSkillTreeConfig.json');

export async function GET() {
  try {
    // Check if the file exists
    try {
      await fs.access(USER_SKILL_TREE_CONFIG_FILE);
    } catch (error) {
      return NextResponse.json({
        content: [],
        message: 'File does not exist',
        exists: false
      });
    }

    // Read the file content
    const data = await fs.readFile(USER_SKILL_TREE_CONFIG_FILE, 'utf-8');
    
    // Try to parse the JSON
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      return NextResponse.json({
        content: data,
        message: 'File exists but contains invalid JSON',
        exists: true,
        isValidJson: false
      });
    }

    // Return the file content
    return NextResponse.json({
      content: parsedData,
      message: 'File exists and contains valid JSON',
      exists: true,
      isValidJson: true,
      fileSize: data.length
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json({
      error: 'Failed to read file',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 