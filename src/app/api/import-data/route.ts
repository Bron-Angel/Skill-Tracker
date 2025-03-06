import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST() {
  try {
    // Run the seed script
    const { stdout, stderr } = await execPromise('npm run prisma:seed');
    
    if (stderr && !stderr.includes('Prisma schema loaded')) {
      console.error('Error running seed script:', stderr);
      return NextResponse.json(
        { error: 'Failed to import test data', details: stderr },
        { status: 500 }
      );
    }
    
    console.log('Seed script output:', stdout);
    
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
