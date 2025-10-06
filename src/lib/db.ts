//connection file
import { Pool } from 'pg';

let db: Pool;

export function getDb(): Pool {
    if (!db) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        
        db = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false,
            },
        });
    }
    return db;
}

// For backward compatibility
export { getDb as db };
