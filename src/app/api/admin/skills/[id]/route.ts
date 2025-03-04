import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.name || session.user.name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { name, experienceNeeded, imageUrl } = await request.json();

    if (!name || typeof experienceNeeded !== 'number') {
      return NextResponse.json({ error: 'Invalid skill data' }, { status: 400 });
    }

    const skill = await prisma.skill.update({
      where: { id },
      data: {
        name,
        experienceNeeded,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({ skill });
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.name || session.user.name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Delete all skill tree configurations for this skill
    await prisma.userSkillTreeConfig.deleteMany({
      where: { skillId: id },
    });

    // Delete the skill
    await prisma.skill.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 