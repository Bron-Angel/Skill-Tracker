import { NextResponse } from 'next/server';
import { db, initializeDb } from '@/lib/jsonDb';
import fs from 'fs/promises';
import path from 'path';

export async function POST() {
  try {
    // Reset the database completely
    await initializeDb(true);
    
    // Create admin user
    const adminUser = await db.user.create({
      username: 'admin',
      level: 0,
      experience: 0,
    });

    console.log('Admin user created:', adminUser);

    // Create levels with the current data
    const levels = [
      {
        "name": "Level 1",
        "experienceNeeded": 10,
        "newSkillCount": 2,
        "id": "c4fe2c86-ee05-4787-ac76-3ccd32966a97"
      },
      {
        "name": "Level 2",
        "experienceNeeded": 10,
        "newSkillCount": 2,
        "id": "3b9ce9ef-35d5-45f1-9bd0-73fc3e689a4c"
      },
      {
        "name": "Level 3",
        "experienceNeeded": 10,
        "newSkillCount": 2,
        "id": "ba068a03-7196-41ab-af33-69b20c0cb427"
      },
      {
        "name": "Level 4",
        "experienceNeeded": 10,
        "newSkillCount": 2,
        "id": "af0b2cdc-f925-4a02-81b7-a2831a639ceb"
      },
      {
        "name": "Level 5",
        "experienceNeeded": 10,
        "newSkillCount": 2,
        "id": "c0dbbccb-a637-4f0f-a170-7d6569372a94"
      }
    ];

    for (const level of levels) {
      await db.level.create(level);
    }

    console.log('Levels created');

    // Create skills with the current data
    const skills = [
      {
        "name": "Clean chairs",
        "experienceNeeded": 4,
        "emoji": "🪑",
        "id": "9ddd219c-d4be-40fb-a435-e1846a90053d"
      },
      {
        "name": "Water plants",
        "experienceNeeded": 4,
        "emoji": "🌱",
        "id": "90016368-92bf-4f70-805d-ab9830946769"
      },
      {
        "name": "Doors",
        "experienceNeeded": 4,
        "emoji": "🚪",
        "id": "391c7a18-bde9-4a5f-9a7b-b89e14431965"
      },
      {
        "name": "Edges",
        "experienceNeeded": 4,
        "emoji": "📏",
        "id": "2c28c86d-8408-475d-a122-4f98d150179e"
      },
      {
        "name": "Clean Counters",
        "experienceNeeded": 4,
        "emoji": "🧼",
        "id": "39b4ad1b-d2db-4eb5-aa82-ac9c1cc787d3"
      },
      {
        "name": "Vacuum",
        "experienceNeeded": 4,
        "emoji": "🔌",
        "id": "87b18d33-f054-4ee8-b0c4-9ee8484b5b38"
      },
      {
        "name": "Sweep",
        "experienceNeeded": 4,
        "emoji": "🧹",
        "id": "59f3719e-8e1a-4162-a6d1-f69c921ff651"
      },
      {
        "name": "Mop",
        "experienceNeeded": 4,
        "emoji": "🧑‍🦯",
        "id": "b7dbf3d5-5af6-4ff5-8cb1-4f219e92d138"
      },
      {
        "name": "Put away dishes",
        "experienceNeeded": 4,
        "emoji": "🍽️",
        "id": "28983b57-6780-48b8-bfb6-0c8cb6ce1957"
      },
      {
        "name": "Garbages",
        "experienceNeeded": 4,
        "emoji": "🗑️",
        "id": "a21ad692-d803-4883-bd79-3002b28dd97d"
      }
    ];

    for (const skill of skills) {
      await db.skill.create(skill);
    }

    console.log('Skills created');
    
    // Reset the userSkillTreeConfig.json file
    const USER_SKILL_TREE_CONFIG_FILE = path.join(process.cwd(), 'data', 'userSkillTreeConfig.json');
    await fs.writeFile(USER_SKILL_TREE_CONFIG_FILE, '[]');
    
    console.log('User skill tree config reset');
    
    return NextResponse.json(
      { success: true, message: 'Test data imported successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error importing test data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import test data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
