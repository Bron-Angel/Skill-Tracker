const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { console.log('Creating levels...'); const levels = [ { name: 'Level 1', experienceNeeded: 10, newSkillCount: 2 }, { name: 'Level 2', experienceNeeded: 10, newSkillCount: 2 }, { name: 'Level 3', experienceNeeded: 10, newSkillCount: 2 }, { name: 'Level 4', experienceNeeded: 10, newSkillCount: 2 }, { name: 'Level 5', experienceNeeded: 10, newSkillCount: 2 } ]; for (const level of levels) { const existingLevel = await prisma.level.findFirst({ where: { name: level.name } }); if (existingLevel) { await prisma.level.update({ where: { id: existingLevel.id }, data: level }); console.log('Updated level:', level.name); } else { const created = await prisma.level.create({ data: level }); console.log('Created level:', created.name); } } console.log('Levels created!'); } main().catch(console.error).finally(() => prisma.$disconnect());
