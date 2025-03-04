import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      level: 0,
      experience: 0,
    },
  });

  console.log('Admin user created:', adminUser);

  // Create levels
  const levels = [
    { name: 'Level 1', experienceNeeded: 10, newSkillCount: 2 },
    { name: 'Level 2', experienceNeeded: 10, newSkillCount: 2 },
    { name: 'Level 3', experienceNeeded: 10, newSkillCount: 2 },
    { name: 'Level 4', experienceNeeded: 10, newSkillCount: 2 },
    { name: 'Level 5', experienceNeeded: 10, newSkillCount: 2 },
  ];

  for (const level of levels) {
    await prisma.level.upsert({
      where: { name: level.name },
      update: level,
      create: level,
    });
  }

  console.log('Levels created');

  // Create skills
  const skills = [
    { name: 'Clean chairs', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
    { name: 'Water plants', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
    { name: 'Doors', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
    { name: 'Edges', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
    { name: 'Clean Counters', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
    { name: 'Vacuum', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
    { name: 'Sweep', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
    { name: 'Mop', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
    { name: 'Put away dishes', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
    { name: 'Garbage Can', experienceNeeded: 4, imageUrl: '/images/skills/placeholder.png' },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: skill,
      create: skill,
    });
  }

  console.log('Skills created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 