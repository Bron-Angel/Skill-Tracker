import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.name || session.user.name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const levels = await prisma.level.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ levels });
  } catch (error) {
    console.error('Error fetching levels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.name || session.user.name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, experienceNeeded, newSkillCount } = await request.json();

    if (!name || typeof experienceNeeded !== 'number' || typeof newSkillCount !== 'number') {
      return NextResponse.json({ error: 'Invalid level data' }, { status: 400 });
    }

    const level = await prisma.level.create({
      data: {
        name,
        experienceNeeded,
        newSkillCount,
      },
    });

    return NextResponse.json({ level });
  } catch (error) {
    console.error('Error creating level:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 