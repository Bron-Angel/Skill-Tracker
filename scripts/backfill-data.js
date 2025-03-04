const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data backfill...');

  // Create levels
  const levels = [
    { name: 'Level 1', experienceNeeded: 10, newSkillCount: 2 },
    { name: 'Level 2', experienceNeeded: 10, newSkillCount: 2 },
    { name: 'Level 3', experienceNeeded: 10, newSkillCount: 2 },
    { name: 'Level 4', experienceNeeded: 10, newSkillCount: 2 },
    { name: 'Level 5', experienceNeeded: 10, newSkillCount: 2 },
  ];

  console.log('Creating levels...');
  for (const level of levels) {
    // First check if the level exists
    const existingLevel = await prisma.level.findFirst({
      where: { name: level.name }
    });

    if (existingLevel) {
      // Update if exists
      await prisma.level.update({
        where: { id: existingLevel.id },
        data: level,
      });
      console.log(`Updated level: ${level.name}`);
    } else {
      // Create if doesn't exist
      const createdLevel = await prisma.level.create({
        data: level,
      });
      console.log(`Created level: ${level.name} with ID: ${createdLevel.id}`);
    }
  }

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

  console.log('Creating skills...');
  for (const skill of skills) {
    // First check if the skill exists
    const existingSkill = await prisma.skill.findFirst({
      where: { name: skill.name }
    });

    if (existingSkill) {
      // Update if exists
      await prisma.skill.update({
        where: { id: existingSkill.id },
        data: skill,
      });
      console.log(`Updated skill: ${skill.name}`);
    } else {
      // Create if doesn't exist
      const createdSkill = await prisma.skill.create({
        data: skill,
      });
      console.log(`Created skill: ${skill.name} with ID: ${createdSkill.id}`);
    }
  }

  console.log('Data backfill completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during data backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });