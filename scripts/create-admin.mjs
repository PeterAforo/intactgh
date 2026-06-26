import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Admin user credentials
const ADMIN_USER = {
  name: "IntactPro Admin",
  email: "admin@intactghana.com",
  password: "admin123",
  phone: "0543008475",
  role: "admin",
};

async function main() {
  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_USER.email } });
  if (existing) {
    console.log(`SKIP  ${ADMIN_USER.email} — already exists`);
    console.log(`      Current role: ${existing.role}`);
    
    // Update role if not admin
    if (existing.role !== "admin") {
      await prisma.user.update({
        where: { email: ADMIN_USER.email },
        data: { role: "admin" }
      });
      console.log(`✓ Updated role to admin`);
    }
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 10);

  // Create admin user
  const user = await prisma.user.create({
    data: {
      name: ADMIN_USER.name,
      email: ADMIN_USER.email,
      password: hashedPassword,
      phone: ADMIN_USER.phone,
      role: ADMIN_USER.role,
      emailVerified: true,
    },
  });

  console.log(`✓ Created admin user:`);
  console.log(`  Email: ${ADMIN_USER.email}`);
  console.log(`  Password: ${ADMIN_USER.password}`);
  console.log(`  Role: ${ADMIN_USER.role}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
