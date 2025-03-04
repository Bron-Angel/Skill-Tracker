const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if .env file exists
const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found. Please create one based on .env.example');
  process.exit(1);
}

try {
  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Create database tables
  console.log('Creating database tables...');
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });

  // Seed the database
  console.log('Seeding the database...');
  execSync('npx prisma db seed', { stdio: 'inherit' });

  console.log('Database setup completed successfully!');
} catch (error) {
  console.error('Error setting up the database:', error.message);
  process.exit(1);
} 