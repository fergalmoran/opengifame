import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:hackme@localhost:5432/opengifame';

// Handle connection string more robustly
const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1, // Limit connections for serverless
});

export const db = drizzle(client, { schema });
