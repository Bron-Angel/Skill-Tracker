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

    // Get all levels
    const levels = await prisma.level.findMany({
      orderBy: { name: 'asc' },
    });

    // Get all skills
    const skills = await prisma.skill.findMany();

    // Get user's skill tree configuration
    const userSkillTreeConfig = await prisma.userSkillTreeConfig.findMany({
      where: { userId: user.id },
      include: {
        level: true,
        skill: true,
      },
    });

    // Prepare levels with assigned skills
    const levelsWithSkills = levels.map((level) => {
      const levelSkills = userSkillTreeConfig
        .filter((config) => config.levelId === level.id)
        .sort((a, b) => a.position - b.position)
        .map((config) => ({
          id: config.skill.id,
          name: config.skill.name,
          experienceNeeded: config.skill.experienceNeeded,
          imageUrl: config.skill.imageUrl || '/images/skills/placeholder.png',
          isUnlocked: user.experience >= config.skill.experienceNeeded,
        }));

      return {
        id: level.id,
        name: level.name,
        experienceNeeded: level.experienceNeeded,
        newSkillCount: level.newSkillCount,
        skills: levelSkills,
      };
    });

    // Get unassigned skills
    const assignedSkillIds = userSkillTreeConfig.map((config) => config.skillId);
    const unassignedSkills = skills
      .filter((skill) => !assignedSkillIds.includes(skill.id))
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        experienceNeeded: skill.experienceNeeded,
        imageUrl: skill.imageUrl || '/images/skills/placeholder.png',
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
    const { skillTreeConfig } = await request.json();

    if (!Array.isArray(skillTreeConfig)) {
      return NextResponse.json({ error: 'Invalid skill tree configuration' }, { status: 400 });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete existing skill tree configuration
    await prisma.userSkillTreeConfig.deleteMany({
      where: { userId: user.id },
    });

    // Create new skill tree configuration
    const newConfigs = [];
    for (const config of skillTreeConfig) {
      const { levelId, skillId, position } = config;
      
      if (!levelId || !skillId || typeof position !== 'number') {
        continue;
      }

      const newConfig = await prisma.userSkillTreeConfig.create({
        data: {
          userId: user.id,
          levelId,
          skillId,
          position,
        },
      });

      newConfigs.push(newConfig);
    }

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