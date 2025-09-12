//connection file
import { createPool } from '@vercel/postgres';

export const db = createPool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
