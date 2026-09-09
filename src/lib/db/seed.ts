import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as dotenv from 'dotenv';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error('DATABASE_URL_UNPOOLED is not set');
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED);
const db = drizzle(sql, { schema });

const initialBuildings = [
  'আল মোস্তফা',
  'এ আর ভবন',
  'জাহেদ ভাই এর বিল্ডিং',
  'চৈতালি',
  'ফয়েজ ম্যানশন',
  'মসজিদ কলোনী',
  'কিছুক্ষন ভিলা',
  'মা যা ভবন',
  'প্রফেসর ভিলা',
  'এরশাদ ভাই এর বিল্ডিং',
  'কণিকালয়',
  'প্রবাসী',
  'সিদ্দিক ম্যানশন',
  'কালাম ইঞ্জিনিয়ার এর বাসা',
  'মুসা ভবন',
  'বসুন্ধরা',
  'শোয়েব ভাই এর বিল্ডিং',
  'শোয়েব ভাই এর পাশে',
  'নিহাল দের',
  'তাসমিয়াহ',
  'দিলরুবা',
  'অমান ভাই এর'
];

async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    // 1. Create default admin user
    const adminEmail = 'admin@touzimaker.com';
    const existingAdmins = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail));
    
    let adminId = '';
    if (existingAdmins.length === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const [admin] = await db.insert(schema.users).values({
        email: adminEmail,
        passwordHash,
        name: 'Admin User',
        role: 'admin',
      }).returning();
      adminId = admin.id;
      console.log('✅ Created admin user (admin@touzimaker.com / admin123)');
    } else {
      adminId = existingAdmins[0].id;
      console.log('ℹ️ Admin user already exists');
    }

    // 2. Create default Area
    const existingAreas = await db.select().from(schema.areas);
    let areaId = '';
    if (existingAreas.length === 0) {
      const [area] = await db.insert(schema.areas).values({
        nameEn: 'Main Area',
        nameBn: 'মূল এলাকা',
      }).returning();
      areaId = area.id;
      console.log('✅ Created default area');
    } else {
      areaId = existingAreas[0].id;
      console.log('ℹ️ Default area already exists');
    }

    // 3. Seed Buildings
    const existingBuildings = await db.select().from(schema.buildings);
    if (existingBuildings.length === 0) {
      const buildingsToInsert = initialBuildings.map((nameBn, index) => ({
        areaId,
        sequenceOrder: (index + 1) * 1.0,
        nameEn: `Building ${index + 1}`,
        nameBn: nameBn,
        isActive: true,
      }));
      
      await db.insert(schema.buildings).values(buildingsToInsert);
      console.log(`✅ Seeded ${initialBuildings.length} buildings`);
    } else {
      console.log(`ℹ️ Buildings already seeded (${existingBuildings.length} found)`);
    }

    // 4. Create current Project
    const existingProjects = await db.select().from(schema.projects);
    if (existingProjects.length === 0) {
      await db.insert(schema.projects).values({
        nameEn: 'Milad-un-Nabi 2026',
        nameBn: 'মিলাদুন্নবী ২০২৬',
        year: 2026,
        status: 'active',
      });
      console.log('✅ Created Milad-un-Nabi 2026 project');
    } else {
      console.log('ℹ️ Project already exists');
    }

    console.log('🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
