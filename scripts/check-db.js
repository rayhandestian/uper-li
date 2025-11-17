/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkTableExists(tableName) {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = $1
    );
  `;
  const result = await pool.query(query, [tableName]);
  return result.rows[0].exists;
}

async function getRecordCount(tableName) {
  const query = `SELECT COUNT(*) as count FROM "${tableName}";`;
  const result = await pool.query(query);
  return parseInt(result.rows[0].count);
}

async function getAllRecords(tableName) {
  let query;
  if (tableName === 'User') {
    // Exclude sensitive fields like password
    query = `SELECT id, email, name, role, "nimOrUsername", "emailVerified", "verificationToken", "verificationTokenExpires", "createdAt", "updatedAt", "monthlyLinksCreated", "totalLinks", "lastReset", "twoFactorEnabled", "twoFactorSecret", active FROM "${tableName}";`;
  } else {
    query = `SELECT * FROM "${tableName}";`;
  }
  const result = await pool.query(query);
  return result.rows;
}

async function checkForeignKeyIntegrity() {
  const issues = [];

  // Check for links without users
  const orphanedLinksQuery = `
    SELECT COUNT(*) as count
    FROM "Link" l
    LEFT JOIN "User" u ON l."userId" = u.id
    WHERE u.id IS NULL;
  `;
  const orphanedLinks = await pool.query(orphanedLinksQuery);
  if (parseInt(orphanedLinks.rows[0].count) > 0) {
    issues.push(`Found ${orphanedLinks.rows[0].count} links without corresponding users`);
  }

  // Check for visits without links
  const orphanedVisitsQuery = `
    SELECT COUNT(*) as count
    FROM "Visit" v
    LEFT JOIN "Link" l ON v."linkId" = l.id
    WHERE l.id IS NULL;
  `;
  const orphanedVisits = await pool.query(orphanedVisitsQuery);
  if (parseInt(orphanedVisits.rows[0].count) > 0) {
    issues.push(`Found ${orphanedVisits.rows[0].count} visits without corresponding links`);
  }

  return issues;
}

async function checkDatabase() {
  console.log('🔍 Checking database health...\n');

  const tables = ['User', 'Link', 'Visit'];

  try {
    // Check connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Test specific shortUrl lookup
    console.log('🔍 Testing shortUrl lookup for "cb2da2"...');
    const testQuery = 'SELECT * FROM "Link" WHERE "shortUrl" = $1';
    const testResult = await pool.query(testQuery, ['cb2da2']);
    console.log(`Found ${testResult.rows.length} links with shortUrl "cb2da2"`);
    if (testResult.rows.length > 0) {
      console.log('Link details:', JSON.stringify(testResult.rows[0], null, 2));
    }
    console.log('');

    // Check tables and display data
    for (const table of tables) {
      const exists = await checkTableExists(table);

      if (exists) {
        const count = await getRecordCount(table);
        console.log(`✅ Table "${table}" exists with ${count} records`);

        if (count > 0) {
          const records = await getAllRecords(table);
          console.log(`📋 Records in "${table}":`);
          records.forEach((record, index) => {
            console.log(`   ${index + 1}. ${JSON.stringify(record, null, 2)}`);
          });
        } else {
          console.log(`   (No records)`);
        }
        console.log('');
      } else {
        console.log(`❌ Table "${table}" does not exist\n`);
      }
    }

    console.log('');

    // Check foreign key integrity
    console.log('🔗 Checking foreign key integrity...');
    const integrityIssues = await checkForeignKeyIntegrity();

    if (integrityIssues.length === 0) {
      console.log('✅ No foreign key integrity issues found');
    } else {
      console.log('⚠️  Foreign key integrity issues:');
      integrityIssues.forEach(issue => console.log(`   - ${issue}`));
    }

    console.log('\n📊 Database check completed');

  } catch (error) {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the check
checkDatabase().catch(console.error);