import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Dashboard
  { name: "dashboard.view", description: "View admin dashboard", group: "Dashboard" },

  // Products
  { name: "products.view", description: "View products list", group: "Products" },
  { name: "products.create", description: "Create new products", group: "Products" },
  { name: "products.edit", description: "Edit existing products", group: "Products" },
  { name: "products.delete", description: "Delete products", group: "Products" },

  // Orders
  { name: "orders.view", description: "View orders list", group: "Orders" },
  { name: "orders.edit", description: "Update order status", group: "Orders" },
  { name: "orders.delete", description: "Delete orders", group: "Orders" },

  // Customers
  { name: "customers.view", description: "View customer list", group: "Customers" },
  { name: "customers.edit", description: "Edit customer details", group: "Customers" },

  // Categories
  { name: "categories.view", description: "View categories", group: "Categories" },
  { name: "categories.create", description: "Create categories", group: "Categories" },
  { name: "categories.edit", description: "Edit categories", group: "Categories" },
  { name: "categories.delete", description: "Delete categories", group: "Categories" },

  // Brands
  { name: "brands.view", description: "View brands", group: "Brands" },
  { name: "brands.create", description: "Create brands", group: "Brands" },
  { name: "brands.edit", description: "Edit brands", group: "Brands" },
  { name: "brands.delete", description: "Delete brands", group: "Brands" },

  // Content
  { name: "pages.manage", description: "Manage static pages", group: "Content" },
  { name: "news.manage", description: "Manage news & blog posts", group: "Content" },
  { name: "hero_slides.manage", description: "Manage hero slides", group: "Content" },
  { name: "banners.manage", description: "Manage banners", group: "Content" },
  { name: "promotions.manage", description: "Manage promotions", group: "Content" },

  // Gift Cards
  { name: "gift_cards.manage", description: "Manage gift cards", group: "Gift Cards" },

  // Careers
  { name: "careers.manage", description: "Manage job postings & applications", group: "Careers" },

  // Users & Roles
  { name: "users.view", description: "View user list", group: "Users & Roles" },
  { name: "users.create", description: "Create new users", group: "Users & Roles" },
  { name: "users.edit", description: "Edit user details & roles", group: "Users & Roles" },
  { name: "users.delete", description: "Delete users", group: "Users & Roles" },
  { name: "roles.manage", description: "Create, edit & delete roles and permissions", group: "Users & Roles" },

  // Settings
  { name: "settings.manage", description: "Manage site settings", group: "Settings" },

  // AI Tools
  { name: "ai_tools.use", description: "Access AI tools", group: "AI Tools" },
];

// Permissions each role gets
const ROLE_DEFINITIONS = {
  admin: {
    description: "Full access to everything",
    isSystem: true,
    permissions: PERMISSIONS.map((p) => p.name), // all
  },
  staff: {
    description: "Manage products, orders, customers and content",
    isSystem: true,
    permissions: PERMISSIONS.map((p) => p.name).filter(
      (p) => !["users.delete", "roles.manage", "settings.manage"].includes(p),
    ),
  },
  customer: {
    description: "Storefront access only — no admin permissions",
    isSystem: true,
    permissions: [] as string[],
  },
};

async function main() {
  console.log("Seeding permissions...");

  // Upsert all permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description, group: perm.group },
      create: perm,
    });
  }
  console.log(`  ✓ ${PERMISSIONS.length} permissions upserted`);

  // Upsert roles and assign permissions
  for (const [roleName, def] of Object.entries(ROLE_DEFINITIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: def.description, isSystem: def.isSystem },
      create: { name: roleName, description: def.description, isSystem: def.isSystem },
    });

    // Clear existing role permissions and re-assign
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    if (def.permissions.length > 0) {
      const perms = await prisma.permission.findMany({
        where: { name: { in: def.permissions } },
        select: { id: true },
      });

      await prisma.rolePermission.createMany({
        data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      });
    }

    console.log(`  ✓ Role "${roleName}" — ${def.permissions.length} permissions`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
