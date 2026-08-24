import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connStr = "postgresql://neondb_owner:npg_rgmlB4pTAV8o@ep-billowing-bread-azc1ckap.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const url = "https://ep-billowing-bread-azc1ckap.c-3.ap-southeast-1.aws.neon.tech/sql";

async function runSql(sqlQuery) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': connStr,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sqlQuery })
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`(${res.status}) ${text}`);
  }

  return JSON.parse(text);
}

function splitSqlStatements(sqlText) {
  // Remove single line comments
  const clean = sqlText
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  return clean
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

async function executeSqlFile(filePath, label) {
  console.log(`\n================ Executing ${label} ================`);
  const content = fs.readFileSync(filePath, 'utf8');
  const statements = splitSqlStatements(content);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const firstLine = stmt.split('\n')[0].substring(0, 60);
    process.stdout.write(`  [${i + 1}/${statements.length}] ${firstLine}... `);
    try {
      await runSql(stmt);
      console.log('✓ OK');
    } catch (err) {
      console.log('✗ Failed');
      console.error('Error details:', err.message);
      throw err;
    }
  }
}

async function main() {
  try {
    // 1. Run V1 Schema
    const v1Path = path.join(__dirname, 'src/main/resources/db/migration/V1__initial_schema.sql');
    await executeSqlFile(v1Path, 'V1 Schema Creation');

    // 2. Run V2 Seed Data
    const v2Path = path.join(__dirname, 'src/main/resources/db/migration/V2__seed_initial_data.sql');
    await executeSqlFile(v2Path, 'V2 Seed Data Migration');

    // 3. Verify Counts
    const users = await runSql('SELECT COUNT(*) as user_count FROM users;');
    const events = await runSql('SELECT COUNT(*) as event_count FROM events;');
    const tags = await runSql('SELECT COUNT(*) as tag_count FROM event_tags;');
    const eventList = await runSql('SELECT id, title, type, mode, status, approval_status FROM events;');

    console.log('\n======================================================');
    console.log('🎉 Neon PostgreSQL Migration & Seeding Successful!');
    console.log('Users in DB:     ', users.rows[0].user_count);
    console.log('Events in DB:    ', events.rows[0].event_count);
    console.log('Event Tags in DB:', tags.rows[0].tag_count);
    console.log('\nSample Events in Database:');
    console.table(eventList.rows);
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Migration stopped with error:', err.message);
    process.exit(1);
  }
}

main();
