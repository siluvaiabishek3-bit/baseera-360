/**
 * BASEERA 360 - Database Seeding Script
 * Creates test organizations, users, and projects for development
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seeding...');

    // Create organization
    const orgId = uuidv4();
    await client.query(
      `INSERT INTO organizations (id, name, slug, subscription_tier, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [orgId, 'BASEERA Demo Organization', 'baseera-demo', 'PRO', true]
    );
    console.log('✅ Organization created');

    // Create test users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const engineerPassword = await bcrypt.hash('engineer123', 10);
    const clientPassword = await bcrypt.hash('client123', 10);
    const testPassword = await bcrypt.hash('password123', 10);

    // Admin user
    const adminId = uuidv4();
    await client.query(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        organization_id, role, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        adminId,
        'admin@baseera.ae',
        adminPassword,
        'Admin',
        'User',
        orgId,
        'ADMIN',
        true,
      ]
    );
    console.log('✅ Admin user created (admin@baseera.ae / admin123)');

    // Engineer user
    const engineerId = uuidv4();
    await client.query(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name,
        organization_id, role, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        engineerId,
        'engineer@baseera.ae',
        engineerPassword,
        'Ahmed',
        'Engineer',
        orgId,
        'ENGINEER',
        true,
      ]
    );
    console.log('✅ Engineer user created (engineer@baseera.ae / engineer123)');

    // Client user
    const clientId = uuidv4();
    await client.query(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name,
        organization_id, role, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        clientId,
        'client@baseera.ae',
        clientPassword,
        'Mohammad',
        'Client',
        orgId,
        'CLIENT',
        true,
      ]
    );
    console.log('✅ Client user created (client@baseera.ae / client123)');

    // Test user (for demos)
    const testId = uuidv4();
    await client.query(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name,
        organization_id, role, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        testId,
        'test@baseera.ae',
        testPassword,
        'Test',
        'User',
        orgId,
        'ENGINEER',
        true,
      ]
    );
    console.log('✅ Test user created (test@baseera.ae / password123)');

    // Create sample project
    const projectId = uuidv4();
    await client.query(
      `INSERT INTO projects (
        id, organization_id, project_name, building_name,
        job_number, facade_type, client_name, status,
        latitude, longitude, address, city, country, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT DO NOTHING`,
      [
        projectId,
        orgId,
        'Marina Tower Facade Inspection',
        'Marina Tower',
        'MAR-2024-001',
        'Glass Curtain Wall',
        'DAMAC Properties',
        'ACTIVE',
        28.5244,
        55.2764,
        'Downtown Dubai',
        'Dubai',
        'United Arab Emirates',
        engineerId,
      ]
    );
    console.log('✅ Sample project created');

    // Create building zones
    const zone1Id = uuidv4();
    const zone2Id = uuidv4();

    await client.query(
      `INSERT INTO building_zones (id, project_id, zone_name, zone_type, floor_number, phase, sequence_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [zone1Id, projectId, 'North Facade', 'ELEVATION', null, 'Phase 1', 1]
    );

    await client.query(
      `INSERT INTO building_zones (id, project_id, zone_name, zone_type, floor_number, phase, sequence_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [zone2Id, projectId, 'East Facade', 'ELEVATION', null, 'Phase 1', 2]
    );
    console.log('✅ Building zones created');

    // Assign users to project
    await client.query(
      `INSERT INTO user_project_roles (user_id, project_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [engineerId, projectId, 'ENGINEER']
    );

    await client.query(
      `INSERT INTO user_project_roles (user_id, project_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [clientId, projectId, 'CLIENT']
    );
    console.log('✅ Users assigned to project');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('───────────────────────────────────────');
    console.log('Admin:     admin@baseera.ae / admin123');
    console.log('Engineer:  engineer@baseera.ae / engineer123');
    console.log('Client:    client@baseera.ae / client123');
    console.log('Test:      test@baseera.ae / password123');
    console.log('───────────────────────────────────────');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
