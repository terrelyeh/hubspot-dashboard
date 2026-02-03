import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { DEFAULT_STAGES, REGION_MULTIPLIERS, Q3_2024_START, Q3_2024_END } from '../src/lib/constants';
import { convertToUSD } from '../src/lib/currency/converter';

const prisma = new PrismaClient();

// Region definitions
const REGIONS = [
  { code: 'US', name: 'United States', currency: 'USD', timezone: 'America/New_York' },
  { code: 'APAC', name: 'Asia Pacific', currency: 'USD', timezone: 'Asia/Singapore' },
  { code: 'IN', name: 'India', currency: 'INR', timezone: 'Asia/Kolkata' },
  { code: 'JP', name: 'Japan', currency: 'JPY', timezone: 'Asia/Tokyo' },
  { code: 'EU', name: 'Europe', currency: 'USD', timezone: 'Europe/London' },
] as const;

// Deal owner names
const DEAL_OWNERS = [
  'John Smith', 'Jane Doe', 'Michael Chen',
  'Sarah Williams', 'David Brown', 'Emma Johnson',
  'Carlos Rodriguez', 'Lisa Anderson', 'Kevin Lee',
] as const;

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.deal.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.target.deleteMany();
  await prisma.stageProbability.deleteMany();
  await prisma.region.deleteMany();
  console.log('✅ Existing data cleared\n');

  // 2. Create regions
  console.log('📍 Creating regions...');
  for (const region of REGIONS) {
    await prisma.region.create({
      data: {
        code: region.code,
        name: region.name,
        currency: region.currency,
        timezone: region.timezone,
        isActive: true,
      },
    });
    console.log(`  ✓ ${region.name} (${region.code})`);
  }
  console.log('');

  // 3. Create stage probabilities
  console.log('📊 Creating stage probabilities...');
  for (const stage of DEFAULT_STAGES) {
    await prisma.stageProbability.create({
      data: {
        stage: stage.name,
        probability: stage.probability,
        source: 'default',
      },
    });
    console.log(`  ✓ ${stage.name}: ${stage.probability}%`);
  }
  console.log('');

  // 4. Create Q3 2024 targets
  console.log('🎯 Creating Q3 2024 targets...');
  const baseTarget = 3000000; // $3M base

  for (const region of REGIONS) {
    const dbRegion = await prisma.region.findUnique({
      where: { code: region.code },
    });

    if (!dbRegion) continue;

    const multiplier = REGION_MULTIPLIERS[region.code as keyof typeof REGION_MULTIPLIERS];
    const targetAmount = baseTarget * multiplier;

    await prisma.target.create({
      data: {
        regionId: dbRegion.id,
        year: 2024,
        quarter: 3,
        amount: targetAmount,
        currency: 'USD',
        notes: 'Seed data for Q3 2024',
      },
    });

    console.log(`  ✓ ${region.code}: $${(targetAmount / 1000000).toFixed(1)}M`);
  }
  console.log('');

  // 5. Generate mock deals
  console.log('💼 Generating mock deals...');

  for (const region of REGIONS) {
    const dbRegion = await prisma.region.findUnique({
      where: { code: region.code },
    });

    if (!dbRegion) continue;

    const dealCount = faker.number.int({ min: 50, max: 80 });
    let created = 0;

    for (let i = 0; i < dealCount; i++) {
      // Generate deal properties
      const stage = faker.helpers.arrayElement(DEFAULT_STAGES);
      const baseAmount = faker.number.int({ min: 5000, max: 500000 });

      // Adjust amount by currency
      let amount = baseAmount;
      if (region.currency === 'JPY') amount *= 110;
      if (region.currency === 'INR') amount *= 75;

      // Convert to USD
      const { amountUsd, exchangeRate } = await convertToUSD(
        amount,
        region.currency,
        faker.date.recent({ days: 30 })
      );

      // Generate dates
      const createdAt = faker.date.past({ years: 1 });
      const closeDate = faker.date.between({
        from: Q3_2024_START,
        to: Q3_2024_END,
      });

      // Last modified: some recent, some stale
      const daysSinceUpdate = faker.number.int({ min: 0, max: 30 });
      const lastModifiedAt = new Date();
      lastModifiedAt.setDate(lastModifiedAt.getDate() - daysSinceUpdate);

      await prisma.deal.create({
        data: {
          hubspotId: `mock-${region.code}-${faker.string.alphanumeric(8)}`,
          regionId: dbRegion.id,
          name: faker.company.catchPhrase(),
          amount: amount,
          currency: region.currency,
          amountUsd: amountUsd,
          exchangeRate: exchangeRate,
          stage: stage.name,
          stageProbability: stage.probability,
          probabilitySource: 'default',
          closeDate: closeDate,
          createdAt: createdAt,
          lastModifiedAt: lastModifiedAt,
          ownerName: faker.helpers.arrayElement(DEAL_OWNERS),
          ownerEmail: faker.internet.email(),
          hubspotUrl: `https://app.hubspot.com/contacts/${faker.number.int()}/deal/${faker.number.int()}`,
        },
      });

      created++;
    }

    console.log(`  ✓ ${region.name}: ${created} deals`);
  }
  console.log('');

  // Summary
  const totalRegions = await prisma.region.count();
  const totalDeals = await prisma.deal.count();
  const totalTargets = await prisma.target.count();
  const totalStages = await prisma.stageProbability.count();

  console.log('📈 Seed Summary:');
  console.log(`  • Regions: ${totalRegions}`);
  console.log(`  • Deals: ${totalDeals}`);
  console.log(`  • Targets: ${totalTargets}`);
  console.log(`  • Stage Probabilities: ${totalStages}`);
  console.log('\n✨ Database seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
