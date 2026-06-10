import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultCategories, defaultLocations, defaultSite } from "../src/lib/defaults";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin12345", 10);
  const staffPassword = await bcrypt.hash("staff12345", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      passwordHash: adminPassword,
      role: "ADMIN"
    }
  });

  await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      name: "Staff",
      email: "staff@example.com",
      passwordHash: staffPassword,
      role: "STAFF"
    }
  });

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category
    });
  }

  for (const location of defaultLocations) {
    await prisma.location.upsert({
      where: { name: location.name },
      update: location,
      create: location
    });
  }

  await prisma.site.upsert({
    where: { name: defaultSite.name },
    update: {},
    create: {
      name: defaultSite.name,
      maps: {
        create: {
          name: defaultSite.mapName,
          width: defaultSite.width,
          height: defaultSite.height
        }
      }
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
