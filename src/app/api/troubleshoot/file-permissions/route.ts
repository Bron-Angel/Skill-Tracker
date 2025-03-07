import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the data directory and file for user skill tree configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const USER_SKILL_TREE_CONFIG_FILE = path.join(DATA_DIR, 'userSkillTreeConfig.json');
const TEST_FILE = path.join(DATA_DIR, 'test-permissions.json');

export async function GET() {
  try {
    // Check if the data directory exists
    let dirExists = false;
    try {
      await fs.access(DATA_DIR);
      dirExists = true;
    } catch (error) {
      // Directory doesn't exist, try to create it
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        dirExists = true;
      } catch (mkdirError) {
        return NextResponse.json({
          success: false,
          message: `Failed to create data directory: ${mkdirError instanceof Error ? mkdirError.message : String(mkdirError)}`,
          dirExists: false
        });
      }
    }

    // Try to write a test file
    try {
      const testData = { test: 'permissions', timestamp: new Date().toISOString() };
      await fs.writeFile(TEST_FILE, JSON.stringify(testData, null, 2));
      
      // Try to read the test file
      const readData = await fs.readFile(TEST_FILE, 'utf-8');
      const parsedData = JSON.parse(readData);
      
      // Clean up the test file
      await fs.unlink(TEST_FILE);
      
      return NextResponse.json({
        success: true,
        message: 'File permissions test passed',
        dirExists,
        canWrite: true,
        canRead: true,
        testData: parsedData
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: `File permissions test failed: ${error instanceof Error ? error.message : String(error)}`,
        dirExists,
        canWrite: false
      });
    }
  } catch (error) {
    console.error('Error testing file permissions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test file permissions',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 