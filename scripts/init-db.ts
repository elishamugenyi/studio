#!/usr/bin/env tsx

/**
 * Database Initialization Script
 * 
 * This script initializes the database by calling the initDb function.
 * Run this script after setting up your DATABASE_URL environment variable.
 * 
 * Usage:
 *   npm run db:init
 *   or
 *   tsx scripts/init-db.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { initDb } from '../src/lib/dbInit';

async function runInit() {
    console.log('🔧 Starting database initialization...');
    
    // Debug: Show if DATABASE_URL is loaded
    if (process.env.DATABASE_URL) {
        console.log('✅ DATABASE_URL found');
        // Mask the password in the URL for security
        const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@');
        console.log(`📡 Database: ${maskedUrl}`);
    } else {
        console.log('❌ DATABASE_URL not found');
        console.log('💡 Make sure you have a .env.local or .env file with DATABASE_URL');
    }
    
    try {
        const result = await initDb({ drop: false });
        
        if (result.success) {
            console.log('✅ Database initialization completed successfully');
            console.log('📊 All tables have been created/updated');
        } else {
            console.error('❌ Database initialization failed:', result.message);
            if (result.error) {
                console.error('Error details:', result.error);
            }
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Database initialization error:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

// Run the initialization
runInit();
