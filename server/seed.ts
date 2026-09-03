import bcrypt from 'bcryptjs';
import prisma from './db';

// Pre-computed bcrypt hashes for fast test database resets
const ADMIN_HASH = bcrypt.hashSync('Admin@123', 10);
const STAFF_HASH = bcrypt.hashSync('Staff@123', 10);

/**
 * Completely wipe all store catalog, inventory, supplier, category, and transaction movement logs.
 * Preserves user accounts and active login sessions so you can build a fresh store from scratch.
 */
export async function wipeStoreData() {
  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany();
    await tx.stockTransaction.deleteMany();
    await tx.product.deleteMany();
    await tx.supplier.deleteMany();
    await tx.category.deleteMany();
  });
}

/**
 * Seeds or resets the database with initial demo data.
 * @param preserveSessions If true, preserves active login sessions. Defaults to false for test isolation.
 */
export async function seedDatabase(preserveSessions = false) {
  await prisma.$transaction(async (tx) => {
    // 1. Clear existing transactional and catalog data in reverse relation order
    await tx.auditLog.deleteMany();
    await tx.stockTransaction.deleteMany();
    if (!preserveSessions) {
      await tx.session.deleteMany();
    }
    await tx.product.deleteMany();
    await tx.supplier.deleteMany();
    await tx.category.deleteMany();

    if (!preserveSessions) {
      await tx.user.deleteMany();
    }

    // 2. Seed or Upsert Users
    const users = [
      {
        id: 'u1',
        name: 'Ahmad Khan',
        email: 'ahmad@stockflow.com',
        passwordHash: ADMIN_HASH,
        role: 'ADMIN',
        status: 'Active',
        createdAt: new Date('2024-01-15T00:00:00.000Z'),
      },
      {
        id: 'u2',
        name: 'Ali Raza',
        email: 'ali@stockflow.com',
        passwordHash: STAFF_HASH,
        role: 'STAFF',
        status: 'Active',
        createdAt: new Date('2024-02-01T00:00:00.000Z'),
      },
      {
        id: 'u3',
        name: 'Sara Ahmed',
        email: 'sara@stockflow.com',
        passwordHash: STAFF_HASH,
        role: 'STAFF',
        status: 'Active',
        createdAt: new Date('2024-03-10T00:00:00.000Z'),
      },
      {
        id: 'u4',
        name: 'Omar Sheikh',
        email: 'omar@stockflow.com',
        passwordHash: STAFF_HASH,
        role: 'STAFF',
        status: 'Inactive',
        createdAt: new Date('2024-04-05T00:00:00.000Z'),
      },
    ];

    for (const user of users) {
      if (preserveSessions) {
        await tx.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            role: user.role,
            status: user.status,
            passwordHash: user.passwordHash,
          },
          create: user,
        });
      } else {
        await tx.user.create({ data: user });
      }
    }

    // 3. Seed Categories
    const categories = [
      {
        id: 'c1',
        name: 'Computer Accessories',
        description: 'Mice, keyboards, and PC peripherals',
        createdAt: new Date('2024-01-15T00:00:00.000Z'),
      },
      {
        id: 'c2',
        name: 'Cables',
        description: 'USB, HDMI, and display connectivity cables',
        createdAt: new Date('2024-01-15T00:00:00.000Z'),
      },
      {
        id: 'c3',
        name: 'Office Equipment',
        description: 'Stands, mounts, and workstation ergonomics',
        createdAt: new Date('2024-01-15T00:00:00.000Z'),
      },
      {
        id: 'c4',
        name: 'Audio',
        description: 'Headphones, headsets, and Bluetooth speakers',
        createdAt: new Date('2024-01-16T00:00:00.000Z'),
      },
    ];

    for (const cat of categories) {
      await tx.category.create({ data: cat });
    }

    // 4. Seed Suppliers
    const suppliers = [
      {
        id: 's1',
        name: 'TechSource Ltd',
        contactPerson: 'John Miller',
        email: 'orders@techsource.com',
        phone: '+1-555-0101',
        address: '123 Tech Park, San Jose, CA 94105',
        leadTime: 5,
        createdAt: new Date('2024-01-10T00:00:00.000Z'),
      },
      {
        id: 's2',
        name: 'Global Electronics',
        contactPerson: 'David Chen',
        email: 'supply@globalelec.com',
        phone: '+1-555-0202',
        address: '456 Industrial Ave, Austin, TX 73301',
        leadTime: 7,
        createdAt: new Date('2024-01-10T00:00:00.000Z'),
      },
      {
        id: 's3',
        name: 'OfficePro Supplies',
        contactPerson: 'Sarah Jenkins',
        email: 'sales@officepro.com',
        phone: '+1-555-0303',
        address: '789 Business Blvd, Chicago, IL 60601',
        leadTime: 3,
        createdAt: new Date('2024-01-12T00:00:00.000Z'),
      },
    ];

    for (const sup of suppliers) {
      await tx.supplier.create({ data: sup });
    }

    // 5. Seed Products
    const products = [
      {
        id: 'p1',
        name: 'Wireless Mouse',
        sku: 'WM-001',
        categoryId: 'c1',
        supplierId: 's1',
        price: 25.99,
        quantity: 4,
        reorderLevel: 10,
        description: 'Ergonomic wireless mouse with USB receiver, 2.4GHz connection, 18-month battery life.',
        isArchived: false,
        createdAt: new Date('2024-01-20T00:00:00.000Z'),
      },
      {
        id: 'p2',
        name: 'Mechanical Keyboard',
        sku: 'MK-002',
        categoryId: 'c1',
        supplierId: 's1',
        price: 89.99,
        quantity: 23,
        reorderLevel: 5,
        description: 'Compact TKL mechanical keyboard with blue switches, white backlight.',
        isArchived: false,
        createdAt: new Date('2024-01-20T00:00:00.000Z'),
      },
      {
        id: 'p3',
        name: 'USB-C Cable',
        sku: 'UC-003',
        categoryId: 'c2',
        supplierId: 's2',
        price: 12.99,
        quantity: 0,
        reorderLevel: 20,
        description: '1.8m braided USB-C to USB-C cable, 100W fast charging, 10Gbps data.',
        isArchived: false,
        createdAt: new Date('2024-01-21T00:00:00.000Z'),
      },
      {
        id: 'p4',
        name: 'Laptop Stand',
        sku: 'LS-004',
        categoryId: 'c3',
        supplierId: 's3',
        price: 49.99,
        quantity: 15,
        reorderLevel: 5,
        description: 'Adjustable aluminum laptop stand, compatible with 10–17 inch laptops.',
        isArchived: false,
        createdAt: new Date('2024-01-21T00:00:00.000Z'),
      },
      {
        id: 'p5',
        name: 'Webcam',
        sku: 'WC-005',
        categoryId: 'c1',
        supplierId: 's1',
        price: 79.99,
        quantity: 8,
        reorderLevel: 10,
        description: '1080p Full HD webcam with built-in noise-cancelling microphone, auto-focus.',
        isArchived: false,
        createdAt: new Date('2024-02-01T00:00:00.000Z'),
      },
      {
        id: 'p6',
        name: 'HDMI Cable',
        sku: 'HC-006',
        categoryId: 'c2',
        supplierId: 's2',
        price: 14.99,
        quantity: 35,
        reorderLevel: 15,
        description: '2m HDMI 2.1 cable, supports 4K@120Hz and 8K@60Hz.',
        isArchived: false,
        createdAt: new Date('2024-02-01T00:00:00.000Z'),
      },
      {
        id: 'p7',
        name: 'Office Headset',
        sku: 'OH-007',
        categoryId: 'c4',
        supplierId: 's3',
        price: 59.99,
        quantity: 3,
        reorderLevel: 8,
        description: 'Over-ear USB headset with active noise-cancelling microphone, Teams certified.',
        isArchived: false,
        createdAt: new Date('2024-02-10T00:00:00.000Z'),
      },
      {
        id: 'p8',
        name: 'Bluetooth Speaker',
        sku: 'BS-008',
        categoryId: 'c4',
        supplierId: 's2',
        price: 129.99,
        quantity: 12,
        reorderLevel: 5,
        description: 'Portable Bluetooth 5.0 speaker, 24-hour battery life, IPX5 water resistant.',
        isArchived: false,
        createdAt: new Date('2024-02-10T00:00:00.000Z'),
      },
    ];

    for (const prod of products) {
      await tx.product.create({ data: prod });
    }

    // 6. Seed Transactions
    const transactions = [
      {
        id: 't1',
        productId: 'p2',
        type: 'STOCK_IN',
        quantity: 10,
        previousStock: 13,
        newStock: 23,
        performedById: 'u1',
        reference: 'PO-2026-001',
        notes: 'Regular stock replenishment from TechSource',
        supplierId: 's1',
        createdAt: new Date('2026-08-28T09:15:00.000Z'),
      },
      {
        id: 't2',
        productId: 'p6',
        type: 'STOCK_IN',
        quantity: 20,
        previousStock: 15,
        newStock: 35,
        performedById: 'u2',
        reference: 'PO-2026-002',
        notes: '',
        supplierId: 's2',
        createdAt: new Date('2026-08-28T11:30:00.000Z'),
      },
      {
        id: 't3',
        productId: 'p3',
        type: 'STOCK_OUT',
        quantity: 5,
        previousStock: 5,
        newStock: 0,
        performedById: 'u3',
        reference: 'SO-2026-015',
        notes: 'Office supply request — IT team',
        supplierId: null,
        createdAt: new Date('2026-08-29T08:45:00.000Z'),
      },
      {
        id: 't4',
        productId: 'p1',
        type: 'STOCK_OUT',
        quantity: 6,
        previousStock: 10,
        newStock: 4,
        performedById: 'u2',
        reference: 'SO-2026-016',
        notes: 'IT department mouse replacement batch',
        supplierId: null,
        createdAt: new Date('2026-08-29T14:20:00.000Z'),
      },
      {
        id: 't5',
        productId: 'p7',
        type: 'STOCK_OUT',
        quantity: 5,
        previousStock: 8,
        newStock: 3,
        performedById: 'u3',
        reference: 'SO-2026-017',
        notes: 'Customer order fulfillment — batch 3',
        supplierId: null,
        createdAt: new Date('2026-08-30T10:00:00.000Z'),
      },
      {
        id: 't6',
        productId: 'p4',
        type: 'STOCK_IN',
        quantity: 5,
        previousStock: 10,
        newStock: 15,
        performedById: 'u1',
        reference: 'PO-2026-003',
        notes: 'Restocking from OfficePro Supplies',
        supplierId: 's3',
        createdAt: new Date('2026-08-30T11:15:00.000Z'),
      },
      {
        id: 't7',
        productId: 'p5',
        type: 'ADJUSTMENT',
        quantity: 2,
        previousStock: 6,
        newStock: 8,
        performedById: 'u1',
        reference: 'ADJ-2026-001',
        notes: 'Inventory count correction after audit',
        supplierId: null,
        createdAt: new Date('2026-08-27T16:00:00.000Z'),
      },
      {
        id: 't8',
        productId: 'p8',
        type: 'STOCK_IN',
        quantity: 8,
        previousStock: 4,
        newStock: 12,
        performedById: 'u2',
        reference: 'PO-2026-004',
        notes: '',
        supplierId: 's2',
        createdAt: new Date('2026-08-26T13:45:00.000Z'),
      },
    ];

    for (const txn of transactions) {
      await tx.stockTransaction.create({ data: txn });
    }

    // 7. Seed Audit Log
    await tx.auditLog.create({
      data: {
        userId: 'u1',
        action: 'SYSTEM_SEED',
        entity: 'DATABASE',
        details: JSON.stringify({ message: 'Initial database fixtures seeded' }),
        ipAddress: '127.0.0.1',
      },
    });
  });
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
  (async () => {
    try {
      const force = process.argv.includes('--force');
      const userCount = await prisma.user.count();
      if (userCount > 0 && !force) {
        console.log('ℹ️ Database already populated. Skipping seed to preserve existing records.');
        process.exit(0);
      }
      await seedDatabase(false);
      console.log('🎉 Database seed completed successfully!');
    } catch (err) {
      console.error('❌ Database seed failed:', err);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}
