import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PIPELINE_STAGES = [
  {
    name: 'Initial Contact',
    code: 'initial_contact',
    probability: 10,
    displayOrder: 1,
    isActive: true,
    isFinal: false,
    isWon: false,
    color: '#94A3B8', // slate-400
    description: 'First contact made with prospect',
  },
  {
    name: 'Qualified Opp.',
    code: 'qualified_opp',
    probability: 20,
    displayOrder: 2,
    isActive: true,
    isFinal: false,
    isWon: false,
    color: '#64748B', // slate-500
    description: 'Opportunity has been qualified',
  },
  {
    name: 'Recommended Prod.',
    code: 'recommended_prod',
    probability: 30,
    displayOrder: 3,
    isActive: true,
    isFinal: false,
    isWon: false,
    color: '#3B82F6', // blue-500
    description: 'Product recommendation provided',
  },
  {
    name: 'Product Evaluation',
    code: 'product_evaluation',
    probability: 40,
    displayOrder: 4,
    isActive: true,
    isFinal: false,
    isWon: false,
    color: '#2563EB', // blue-600
    description: 'Customer evaluating the product',
  },
  {
    name: 'Quote Sent',
    code: 'quote_sent',
    probability: 60,
    displayOrder: 5,
    isActive: true,
    isFinal: false,
    isWon: false,
    color: '#8B5CF6', // violet-500
    description: 'Quote has been sent to customer',
  },
  {
    name: 'On-Hold',
    code: 'on_hold',
    probability: 70,
    displayOrder: 6,
    isActive: true,
    isFinal: false,
    isWon: false,
    color: '#F59E0B', // amber-500
    description: 'Deal is temporarily on hold',
  },
  {
    name: 'PO Pending',
    code: 'po_pending',
    probability: 90,
    displayOrder: 7,
    isActive: true,
    isFinal: false,
    isWon: false,
    color: '#10B981', // emerald-500
    description: 'Purchase order is pending',
  },
  {
    name: 'Closed Won',
    code: 'closed_won',
    probability: 100,
    displayOrder: 8,
    isActive: true,
    isFinal: true,
    isWon: true,
    color: '#059669', // emerald-600
    description: 'Deal successfully won',
  },
  {
    name: 'Closed Lost',
    code: 'closed_lost',
    probability: 0,
    displayOrder: 9,
    isActive: true,
    isFinal: true,
    isWon: false,
    color: '#DC2626', // red-600
    description: 'Deal was lost',
  },
];

async function main() {
  console.log('🌱 Seeding pipeline stages...');

  // Clear existing stages
  await prisma.pipelineStage.deleteMany({});
  console.log('Cleared existing pipeline stages');

  // Create new stages
  for (const stage of PIPELINE_STAGES) {
    const created = await prisma.pipelineStage.create({
      data: stage,
    });
    console.log(`✓ Created: ${created.name} (${created.probability}%)`);
  }

  console.log('\n✅ Pipeline stages seeded successfully!');
  console.log(`Total stages: ${PIPELINE_STAGES.length}`);
}

main()
  .catch((e) => {
    console.error('Error seeding pipeline stages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
