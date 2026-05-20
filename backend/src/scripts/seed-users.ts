import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding users...");
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    console.log("ADMIN_PASSWORD is not set. Skipping admin user creation.");
    return;
  }
  
  const defaultPassword = await bcrypt.hash(adminPassword, 10);

  // Admin user
  await prisma.user.upsert({
    where: { email: "admin@autopulse.local" },
    update: {},
    create: {
      email: "admin@autopulse.local",
      password: defaultPassword,
      role: "ADMIN"
    }
  });

  console.log("Admin user seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
