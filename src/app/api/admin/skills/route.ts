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

    const skills = await prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.name || session.user.name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, experienceNeeded, imageUrl } = await request.json();

    if (!name || typeof experienceNeeded !== 'number') {
      return NextResponse.json({ error: 'Invalid skill data' }, { status: 400 });
    }

    const skill = await prisma.skill.create({
      data: {
        name,
        experienceNeeded,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({ skill });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 