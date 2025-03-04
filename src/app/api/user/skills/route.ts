import { NextResponse } from 'next/server';
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

    // Get all skills from the database
    const allSkills = await prisma.skill.findMany();

    // Get user's skill tree configuration
    const userSkillTreeConfig = await prisma.userSkillTreeConfig.findMany({
      where: { userId: user.id },
      include: {
        skill: true,
      },
    });

    // If user has no skill tree configuration, return all skills as locked
    if (userSkillTreeConfig.length === 0) {
      const skills = allSkills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        experienceNeeded: skill.experienceNeeded,
        imageUrl: skill.imageUrl || '/images/skills/placeholder.png',
        isUnlocked: false,
      }));

      return NextResponse.json({ skills });
    }

    // Calculate which skills are unlocked
    const userSkills = userSkillTreeConfig.map((config) => {
      const skill = config.skill;
      return {
        id: skill.id,
        name: skill.name,
        experienceNeeded: skill.experienceNeeded,
        imageUrl: skill.imageUrl || '/images/skills/placeholder.png',
        isUnlocked: user.experience >= skill.experienceNeeded,
      };
    });

    return NextResponse.json({ skills: userSkills });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 