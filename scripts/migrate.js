#!/usr/bin/env node

import { execSync } from 'child_process';

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Check if we have a DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  No DATABASE_URL found, skipping migrations');
      return;
    }

    // Run migrations
    execSync('npx drizzle-kit migrate', { 
      stdio: 'inherit',
      env: process.env 
    });
    
    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
