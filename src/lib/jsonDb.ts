import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// Define the data directory
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LEVELS_FILE = path.join(DATA_DIR, 'levels.json');
const SKILLS_FILE = path.join(DATA_DIR, 'skills.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Define types that match your Prisma schema
export type User = {
  id: string;
  username: string;
  level: number;
  experience: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Level = {
  id: string;
  name: string;
  experienceNeeded: number;
  newSkillCount: number;
};

export type Skill = {
  id: string;
  name: string;
  experienceNeeded: number;
  emoji: string;
};

export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
};

// Define the UserSkillTreeConfig type
export type UserSkillTreeConfig = {
  id: string;
  userId: string;
  levelId: string;
  skillId: string;
  position: number;
};

// Define the SkillTreeConfig type for the transformed data structure
export type SkillTreeConfig = {
  username: string;
  levels: {
    id: string;
    name: string;
    skills: string[];
  }[];
};

// Add this function to completely reset a file
export async function resetFile(filePath: string, defaultContent: string = '[]'): Promise<void> {
  try {
    await fs.writeFile(filePath, defaultContent);
  } catch (error) {
    console.error(`Error resetting file ${filePath}:`, error);
    throw error;
  }
}

// Update the initializeDb function to accept a reset parameter
export async function initializeDb(reset: boolean = false): Promise<void> {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Initialize files if they don't exist or reset is true
    const files = [
      { path: USERS_FILE, defaultContent: '[]' },
      { path: LEVELS_FILE, defaultContent: '[]' },
      { path: SKILLS_FILE, defaultContent: '[]' },
      { path: SESSIONS_FILE, defaultContent: '[]' },
    ];
    
    for (const file of files) {
      if (reset) {
        // Force reset the file
        await resetFile(file.path, file.defaultContent);
      } else {
        try {
          await fs.access(file.path);
        } catch {
          await fs.writeFile(file.path, file.defaultContent);
        }
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Generic read function
async function readData<T>(filePath: string): Promise<T[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading from ${filePath}:`, error);
    return [];
  }
}

// Generic write function
async function writeData<T>(filePath: string, data: T[]): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    throw error;
  }
}

// User CRUD operations
export const userDb = {
  findUnique: async (where: { id?: string; username?: string }): Promise<User | null> => {
    const users = await readData<User>(USERS_FILE);
    return users.find(user => 
      (where.id && user.id === where.id) || 
      (where.username && user.username === where.username)
    ) || null;
  },
  
  create: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const users = await readData<User>(USERS_FILE);
    const newUser: User = {
      ...data,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.push(newUser);
    await writeData(USERS_FILE, users);
    return newUser;
  },
  
  update: async (where: { id: string }, data: Partial<User>): Promise<User> => {
    const users = await readData<User>(USERS_FILE);
    const index = users.findIndex(user => user.id === where.id);
    if (index === -1) throw new Error(`User with id ${where.id} not found`);
    
    users[index] = {
      ...users[index],
      ...data,
      updatedAt: new Date(),
    };
    
    await writeData(USERS_FILE, users);
    return users[index];
  },
  
  findMany: async (): Promise<User[]> => {
    return readData<User>(USERS_FILE);
  },
  
  delete: async (where: { id: string }): Promise<User> => {
    const users = await readData<User>(USERS_FILE);
    const index = users.findIndex(user => user.id === where.id);
    if (index === -1) throw new Error(`User with id ${where.id} not found`);
    
    const deletedUser = users[index];
    users.splice(index, 1);
    await writeData(USERS_FILE, users);
    return deletedUser;
  },
  
  upsert: async (where: { username: string }, update: Partial<User>, create: Omit<User, 'id'>): Promise<User> => {
    const existingUser = await userDb.findUnique(where);
    if (existingUser) {
      return userDb.update({ id: existingUser.id }, update);
    } else {
      return userDb.create(create as Omit<User, 'id' | 'createdAt' | 'updatedAt'>);
    }
  }
};

// Level CRUD operations
export const levelDb = {
  findFirst: async (where: { name?: string }): Promise<Level | null> => {
    const levels = await readData<Level>(LEVELS_FILE);
    return levels.find(level => 
      (where.name && level.name === where.name)
    ) || null;
  },
  
  create: async (data: Omit<Level, 'id'>): Promise<Level> => {
    const levels = await readData<Level>(LEVELS_FILE);
    const newLevel: Level = {
      ...data,
      id: randomUUID(),
    };
    levels.push(newLevel);
    await writeData(LEVELS_FILE, levels);
    return newLevel;
  },
  
  update: async (where: { id: string }, data: Partial<Level>): Promise<Level> => {
    const levels = await readData<Level>(LEVELS_FILE);
    const index = levels.findIndex(level => level.id === where.id);
    if (index === -1) throw new Error(`Level with id ${where.id} not found`);
    
    levels[index] = {
      ...levels[index],
      ...data,
    };
    
    await writeData(LEVELS_FILE, levels);
    return levels[index];
  },
  
  findMany: async (): Promise<Level[]> => {
    return readData<Level>(LEVELS_FILE);
  },
  
  delete: async (where: { id: string }): Promise<Level> => {
    const levels = await readData<Level>(LEVELS_FILE);
    const index = levels.findIndex(level => level.id === where.id);
    if (index === -1) throw new Error(`Level with id ${where.id} not found`);
    
    const deletedLevel = levels[index];
    levels.splice(index, 1);
    await writeData(LEVELS_FILE, levels);
    return deletedLevel;
  },
};

// Skill CRUD operations
export const skillDb = {
  findFirst: async (where: { name?: string }): Promise<Skill | null> => {
    const skills = await readData<Skill>(SKILLS_FILE);
    return skills.find(skill => 
      (where.name && skill.name === where.name)
    ) || null;
  },
  
  create: async (data: Omit<Skill, 'id'>): Promise<Skill> => {
    const skills = await readData<Skill>(SKILLS_FILE);
    const newSkill: Skill = {
      ...data,
      id: randomUUID(),
    };
    skills.push(newSkill);
    await writeData(SKILLS_FILE, skills);
    return newSkill;
  },
  
  update: async (where: { id: string }, data: Partial<Skill>): Promise<Skill> => {
    const skills = await readData<Skill>(SKILLS_FILE);
    const index = skills.findIndex(skill => skill.id === where.id);
    if (index === -1) throw new Error(`Skill with id ${where.id} not found`);
    
    skills[index] = {
      ...skills[index],
      ...data,
    };
    
    await writeData(SKILLS_FILE, skills);
    return skills[index];
  },
  
  findMany: async (): Promise<Skill[]> => {
    return readData<Skill>(SKILLS_FILE);
  },
  
  delete: async (where: { id: string }): Promise<Skill> => {
    const skills = await readData<Skill>(SKILLS_FILE);
    const index = skills.findIndex(skill => skill.id === where.id);
    if (index === -1) throw new Error(`Skill with id ${where.id} not found`);
    
    const deletedSkill = skills[index];
    skills.splice(index, 1);
    await writeData(SKILLS_FILE, skills);
    return deletedSkill;
  },
};

// Session CRUD operations
export const sessionDb = {
  create: async (data: Omit<Session, 'id'>): Promise<Session> => {
    const sessions = await readData<Session>(SESSIONS_FILE);
    const newSession: Session = {
      ...data,
      id: randomUUID(),
    };
    sessions.push(newSession);
    await writeData(SESSIONS_FILE, sessions);
    return newSession;
  },
  
  findUnique: async (where: { id: string }): Promise<Session | null> => {
    const sessions = await readData<Session>(SESSIONS_FILE);
    return sessions.find(session => session.id === where.id) || null;
  },
  
  findMany: async (where: { userId?: string } = {}): Promise<Session[]> => {
    const sessions = await readData<Session>(SESSIONS_FILE);
    if (where.userId) {
      return sessions.filter(session => session.userId === where.userId);
    }
    return sessions;
  },
  
  delete: async (where: { id: string }): Promise<Session> => {
    const sessions = await readData<Session>(SESSIONS_FILE);
    const index = sessions.findIndex(session => session.id === where.id);
    if (index === -1) throw new Error(`Session with id ${where.id} not found`);
    
    const deletedSession = sessions[index];
    sessions.splice(index, 1);
    await writeData(SESSIONS_FILE, sessions);
    return deletedSession;
  },
};

// SkillTreeConfig operations
export const skillTreeConfigDb = {
  findUnique: async ({ username }: { username: string }): Promise<SkillTreeConfig | null> => {
    try {
      // Read the user skill tree config file
      const userSkillTreeConfigPath = path.join(DATA_DIR, 'userSkillTreeConfig.json');
      
      try {
        await fs.access(userSkillTreeConfigPath);
      } catch {
        // If file doesn't exist, return null
        return null;
      }
      
      const data = await fs.readFile(userSkillTreeConfigPath, 'utf-8');
      const configs: UserSkillTreeConfig[] = JSON.parse(data);
      
      // Get the user ID
      const user = await userDb.findUnique({ username });
      if (!user) return null;
      
      // Filter configs for this user
      const userConfigs = configs.filter(config => config.userId === user.id);
      if (userConfigs.length === 0) return null;
      
      // Get all levels
      const levels = await levelDb.findMany();
      
      // Transform the data into the expected format
      const result: SkillTreeConfig = {
        username,
        levels: []
      };
      
      // Group skills by level
      const levelMap = new Map<string, string[]>();
      
      for (const config of userConfigs) {
        if (!levelMap.has(config.levelId)) {
          levelMap.set(config.levelId, []);
        }
        
        const skills = levelMap.get(config.levelId);
        if (skills) {
          skills.push(config.skillId);
        }
      }
      
      // Create the levels array
      for (const level of levels) {
        const skills = levelMap.get(level.id) || [];
        
        result.levels.push({
          id: level.id,
          name: level.name,
          skills
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error finding skill tree config:', error);
      return null;
    }
  }
};

// Export the database object
export const db = {
  user: userDb,
  level: levelDb,
  skill: skillDb,
  session: sessionDb,
  skillTreeConfig: skillTreeConfigDb
}; 