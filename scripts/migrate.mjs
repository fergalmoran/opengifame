#!/usr/bin/env node
import postgres from 'postgres';
import {drizzle} from 'drizzle-orm/postgres-js';
import {migrate} from 'drizzle-orm/postgres-js/migrator';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.log('⚠️  No DATABASE_URL found, skipping migrations');
  process.exit(0);
}

const client = postgres(process.env.DATABASE_URL, {max: 1});
const db = drizzle(client);

try {
  await migrate(db, {migrationsFolder: join(__dirname, '../drizzle')});
  console.log('✅ Migrations applied');
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
