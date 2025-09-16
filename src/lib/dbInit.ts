import { db } from "@/lib/db";

// Initialize and manage database schema
export async function initDb({ drop = false } = {}) {
  const client = await db.connect();
  try {
    if (drop) {
      console.log("⚠️ Dropping existing tables...");
      await client.query(`
        DROP TABLE IF EXISTS reg_users CASCADE;
      `);
    }

    // Create table if it doesn’t exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS reg_users (
        regID SERIAL PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL,
        password TEXT
      );
    `);

    // Ensure index exists on email
    const indexResult = await client.query(`
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'reg_users' 
        AND indexname = 'idx_reg_users_email'
    `);

    if (indexResult.rowCount === 0) {
        console.log("Creating index on email column for reg_users table.");
        await client.query(`CREATE INDEX idx_reg_users_email ON reg_users (email);`);
    }

    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Database init error:", error);
  } finally {
    client.release();
  }
}
