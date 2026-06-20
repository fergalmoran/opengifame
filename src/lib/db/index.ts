import {drizzle} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import {env} from '@/env';

const client = postgres(env.DATABASE_URL, {
  ssl: env.DB_SSL === 'false' ? false : process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1,
});

export const db = drizzle(client, {schema});
