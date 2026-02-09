/**
 * Script to add India region to production database
 * Run with: npx tsx scripts/add-india-region.ts
 *
 * Make sure to set DATABASE_URL to production Supabase URL before running
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🇮🇳 Adding India region to database...\n');

  // Check if India region already exists
  const existingRegion = await prisma.region.findUnique({
    where: { code: 'IN' },
  });

  if (existingRegion) {
    console.log('✅ India region already exists:');
    console.log(`   ID: ${existingRegion.id}`);
    console.log(`   Name: ${existingRegion.name}`);
    console.log(`   Currency: ${existingRegion.currency}`);
    console.log(`   Timezone: ${existingRegion.timezone}`);
    return;
  }

  // Create India region
  const region = await prisma.region.create({
    data: {
      code: 'IN',
      name: 'India',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      isActive: true,
    },
  });

  console.log('✅ India region created successfully:');
  console.log(`   ID: ${region.id}`);
  console.log(`   Code: ${region.code}`);
  console.log(`   Name: ${region.name}`);
  console.log(`   Currency: ${region.currency}`);
  console.log(`   Timezone: ${region.timezone}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
