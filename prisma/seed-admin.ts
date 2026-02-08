import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding admin user...");

  // Hash a temporary password
  const tempPassword = "ChangeMe123!";
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  // Create or update admin user
  const admin = await prisma.user.upsert({
    where: { email: "terrel.yeh@senao.com" },
    update: {},
    create: {
      email: "terrel.yeh@senao.com",
      name: "Terrel Yeh",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Admin user created/updated:", admin.email);
  console.log("");
  console.log("📋 Login credentials:");
  console.log("   Email:", admin.email);
  console.log("   Password:", tempPassword);
  console.log("");
  console.log("⚠️  Please change your password after first login!");

  // Ensure regions exist
  const regions = [
    { code: "JP", name: "Japan", currency: "JPY", timezone: "Asia/Tokyo" },
    { code: "APAC", name: "Asia Pacific", currency: "USD", timezone: "Asia/Singapore" },
  ];

  for (const region of regions) {
    await prisma.region.upsert({
      where: { code: region.code },
      update: {},
      create: region,
    });
    console.log(`✅ Region "${region.code}" ensured`);
  }

  console.log("");
  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
