import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const username = session.user.name;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's skill tree configuration
    const userSkillTreeConfig = await prisma.userSkillTreeConfig.findMany({
      where: { userId: user.id },
      include: {
        level: true,
        skill: true,
      },
    });

    // Get all levels
    const levels = await prisma.level.findMany({
      orderBy: { experienceNeeded: 'asc' },
    });

    // Calculate total experience needed for next level
    let totalExperienceForNextLevel = 0;
    let currentLevel = user.level;
    
    // If user has a custom skill tree configuration
    if (userSkillTreeConfig.length > 0) {
      // Get the next level from user's configuration
      const nextLevelConfig = userSkillTreeConfig.find(
        (config) => config.level.name === `Level ${currentLevel + 1}`
      );
      
      if (nextLevelConfig) {
        totalExperienceForNextLevel = nextLevelConfig.level.experienceNeeded;
      } else {
        // Default to the next level in the system
        const nextLevel = levels.find((level) => level.name === `Level ${currentLevel + 1}`);
        totalExperienceForNextLevel = nextLevel?.experienceNeeded || 10;
      }
    } else {
      // Default to the next level in the system
      const nextLevel = levels.find((level) => level.name === `Level ${currentLevel + 1}`);
      totalExperienceForNextLevel = nextLevel?.experienceNeeded || 10;
    }

    // Get skills for current level
    const currentLevelSkills = userSkillTreeConfig.filter(
      (config) => config.level.name === `Level ${currentLevel}`
    );

    // Calculate unlocked and locked skills
    const unlockedSkills = [];
    const skillsToUnlock = [];

    for (const config of currentLevelSkills) {
      const skill = {
        id: config.skill.id,
        name: config.skill.name,
        experienceNeeded: config.skill.experienceNeeded,
        imageUrl: config.skill.imageUrl || '/images/skills/placeholder.png',
      };

      if (user.experience >= config.skill.experienceNeeded) {
        unlockedSkills.push(skill);
      } else {
        skillsToUnlock.push(skill);
      }
    }

    return NextResponse.json({
      level: user.level,
      experience: user.experience,
      totalExperienceForNextLevel,
      unlockedSkills,
      skillsToUnlock,
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
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
    const { experiencePoints } = await request.json();

    if (typeof experiencePoints !== 'number' || experiencePoints <= 0) {
      return NextResponse.json({ error: 'Invalid experience points' }, { status: 400 });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all levels
    const levels = await prisma.level.findMany({
      orderBy: { experienceNeeded: 'asc' },
    });

    // Calculate new experience and level
    let newExperience = user.experience + experiencePoints;
    let newLevel = user.level;

    // Check if user leveled up
    let leveledUp = false;
    while (true) {
      const nextLevel = levels.find((level) => level.name === `Level ${newLevel + 1}`);
      
      if (!nextLevel) {
        break;
      }

      if (newExperience >= nextLevel.experienceNeeded) {
        newLevel++;
        newExperience -= nextLevel.experienceNeeded;
        leveledUp = true;
      } else {
        break;
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        level: newLevel,
        experience: newExperience,
      },
    });

    // Get user's skill tree configuration
    const userSkillTreeConfig = await prisma.userSkillTreeConfig.findMany({
      where: { userId: user.id },
      include: {
        level: true,
        skill: true,
      },
    });

    // Calculate total experience needed for next level
    let totalExperienceForNextLevel = 0;
    
    // If user has a custom skill tree configuration
    if (userSkillTreeConfig.length > 0) {
      // Get the next level from user's configuration
      const nextLevelConfig = userSkillTreeConfig.find(
        (config) => config.level.name === `Level ${newLevel + 1}`
      );
      
      if (nextLevelConfig) {
        totalExperienceForNextLevel = nextLevelConfig.level.experienceNeeded;
      } else {
        // Default to the next level in the system
        const nextLevel = levels.find((level) => level.name === `Level ${newLevel + 1}`);
        totalExperienceForNextLevel = nextLevel?.experienceNeeded || 10;
      }
    } else {
      // Default to the next level in the system
      const nextLevel = levels.find((level) => level.name === `Level ${newLevel + 1}`);
      totalExperienceForNextLevel = nextLevel?.experienceNeeded || 10;
    }

    // Get skills for current level
    const currentLevelSkills = userSkillTreeConfig.filter(
      (config) => config.level.name === `Level ${newLevel}`
    );

    // Calculate unlocked and locked skills
    const unlockedSkills = [];
    const skillsToUnlock = [];

    for (const config of currentLevelSkills) {
      const skill = {
        id: config.skill.id,
        name: config.skill.name,
        experienceNeeded: config.skill.experienceNeeded,
        imageUrl: config.skill.imageUrl || '/images/skills/placeholder.png',
      };

      if (newExperience >= config.skill.experienceNeeded) {
        unlockedSkills.push(skill);
      } else {
        skillsToUnlock.push(skill);
      }
    }

    return NextResponse.json({
      level: newLevel,
      experience: newExperience,
      totalExperienceForNextLevel,
      unlockedSkills,
      skillsToUnlock,
      leveledUp,
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 