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
    const { name, experienceNeeded, newSkillCount } = await request.json();

    if (!name || typeof experienceNeeded !== 'number' || typeof newSkillCount !== 'number') {
      return NextResponse.json({ error: 'Invalid level data' }, { status: 400 });
    }

    const level = await prisma.level.update({
      where: { id },
      data: {
        name,
        experienceNeeded,
        newSkillCount,
      },
    });

    return NextResponse.json({ level });
  } catch (error) {
    console.error('Error updating level:', error);
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

    // Delete all skill tree configurations for this level
    await prisma.userSkillTreeConfig.deleteMany({
      where: { levelId: id },
    });

    // Delete the level
    await prisma.level.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting level:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 