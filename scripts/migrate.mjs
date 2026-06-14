#!/usr/bin/env node
import postgres from 'postgres';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.log('⚠️  No DATABASE_URL found, skipping migrations');
  process.exit(0);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id     SERIAL  PRIMARY KEY,
      hash   TEXT    NOT NULL UNIQUE,
      created_at BIGINT
    )
  `;

  const drizzleDir = join(__dirname, '../drizzle');
  const files = (await readdir(drizzleDir))
    .filter(f => f.endsWith('.sql'))
    .sort();

  let applied = 0;
  for (const file of files) {
    const hash = file.replace('.sql', '');
    const rows = await sql`SELECT id FROM __drizzle_migrations WHERE hash = ${hash}`;
    if (rows.length > 0) continue;

    console.log(`  Applying ${file}...`);
    const content = await readFile(join(drizzleDir, file), 'utf8');
    const statements = content
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await sql.unsafe(stmt);
    }
    await sql`INSERT INTO __drizzle_migrations (hash, created_at) VALUES (${hash}, ${Date.now()})`;
    applied++;
  }

  console.log(applied === 0 ? '✅ No new migrations' : `✅ Applied ${applied} migration(s)`);
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
