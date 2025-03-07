import { db, initializeDb } from '../src/lib/jsonDb';

async function main() {
  // Initialize the JSON database
  await initializeDb();

  // Create admin user
  const adminUser = await db.user.upsert(
    { username: 'admin' },
    {},
    {
      username: 'admin',
      level: 0,
      experience: 0,
    }
  );

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
    // First check if the level already exists
    const existingLevel = await db.level.findFirst({
      where: { name: level.name }
    });

    if (existingLevel) {
      // Update existing level
      await db.level.update({
        where: { id: existingLevel.id },
        data: level,
      });
    } else {
      // Create new level
      await db.level.create({
        data: level,
      });
    }
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
    // First check if the skill already exists
    const existingSkill = await db.skill.findFirst({
      where: { name: skill.name }
    });

    if (existingSkill) {
      // Update existing skill
      await db.skill.update({
        where: { id: existingSkill.id },
        data: skill,
      });
    } else {
      // Create new skill
      await db.skill.create({
        data: skill,
      });
    }
  }

  console.log('Skills created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 