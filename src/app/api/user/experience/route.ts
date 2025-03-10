import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/jsonDb';
import fs from 'fs/promises';
import path from 'path';

// Define the user experience data structure
interface UserExperience {
  username: string;
  experience: number;
}

// Helper function to read user experience data
async function readUserExperience(username: string): Promise<number> {
  try {
    const userDataPath = path.join(process.cwd(), 'data', 'users', `${username}.json`);
    const userData = await fs.readFile(userDataPath, 'utf-8');
    const user = JSON.parse(userData);
    return user.experience || 0;
  } catch (error) {
    console.error('Error reading user experience:', error);
    return 0;
  }
}

// Helper function to write user experience data
async function writeUserExperience(username: string, experience: number): Promise<void> {
  try {
    const userDataPath = path.join(process.cwd(), 'data', 'users', `${username}.json`);
    
    // Ensure the user data file exists
    try {
      await fs.access(userDataPath);
    } catch {
      // Create a new user data file if it doesn't exist
      const userDir = path.join(process.cwd(), 'data', 'users');
      await fs.mkdir(userDir, { recursive: true });
      await fs.writeFile(userDataPath, JSON.stringify({ username, experience: 0 }));
    }
    
    // Read existing user data
    const userData = await fs.readFile(userDataPath, 'utf-8');
    const user = JSON.parse(userData);
    
    // Update experience
    user.experience = experience;
    
    // Write updated user data
    await fs.writeFile(userDataPath, JSON.stringify(user, null, 2));
  } catch (error) {
    console.error('Error writing user experience:', error);
    throw new Error('Failed to update user experience');
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user || !session.user.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = session.user.name;
    
    // Parse request body
    const body = await request.json();
    const { experienceChange } = body;
    
    if (typeof experienceChange !== 'number') {
      return NextResponse.json({ error: 'Invalid experience change value' }, { status: 400 });
    }
    
    // Get current experience
    const currentExperience = await readUserExperience(username);
    
    // Calculate new experience (ensure it doesn't go below 0)
    const newExperience = Math.max(0, currentExperience + experienceChange);
    
    // Update user experience
    await writeUserExperience(username, newExperience);
    
    return NextResponse.json({ 
      success: true, 
      experience: newExperience,
      change: experienceChange,
      previousExperience: currentExperience
    });
  } catch (error) {
    console.error('Error updating experience:', error);
    return NextResponse.json({ error: 'Failed to update experience' }, { status: 500 });
  }
}

// Add GET method to retrieve user experience
export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession();
    if (!session || !session.user || !session.user.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = session.user.name;
    
    // Get current experience
    const experience = await readUserExperience(username);
    
    return NextResponse.json({ 
      success: true, 
      experience
    });
  } catch (error) {
    console.error('Error retrieving experience:', error);
    return NextResponse.json({ error: 'Failed to retrieve experience' }, { status: 500 });
  }
} 