import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/jsonDb';

export async function GET() {
  const session = await getServerSession();
  
  if (!session || session.user?.name !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const levels = await db.level.findMany();
    return NextResponse.json({ levels });
  } catch (error) {
    console.error('Error fetching levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch levels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session || session.user?.name !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const level = await db.level.create({
      name: data.name,
      experienceNeeded: data.experienceNeeded,
      newSkillCount: data.newSkillCount,
    });
    
    return NextResponse.json({ level });
  } catch (error) {
    console.error('Error creating level:', error);
    return NextResponse.json(
      { error: 'Failed to create level' },
      { status: 500 }
    );
  }
} 