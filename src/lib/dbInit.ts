import { db } from "@/lib/db";

// Initialize and manage database schema
export async function initDb({ drop = false } = {}) {
  const client = await db.connect();
  try {
    if (drop) {
      console.log("⚠️ Dropping existing tables...");
      await client.query(`
        DROP TABLE IF EXISTS reg_users CASCADE;
        DROP TABLE IF EXISTS finance CASCADE;
        DROP TABLE IF EXISTS module CASCADE;
        DROP TABLE IF EXISTS developer CASCADE;
        DROP TABLE IF EXISTS team_lead CASCADE;
        DROP TABLE IF EXISTS project CASCADE;
      `);
    }

    // Create reg-users table if it doesn’t exist
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

    // Team Lead table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_lead (
        teamLeadId SERIAL PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL
      );
    `);

    // Developer table
    await client.query(`
      CREATE TABLE IF NOT EXISTS developer (
        developerId SERIAL PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        expertise VARCHAR(255),
        department VARCHAR(255),
        assignedTeamLead INT,
        CONSTRAINT fk_dev_team_lead FOREIGN KEY (assignedTeamLead) REFERENCES team_lead(teamLeadId) ON DELETE SET NULL
      );
    `);

    // Project table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project (
        projectId SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration VARCHAR(100),
        developerName VARCHAR(255),
        developerId INT,
        status VARCHAR(50) DEFAULT 'Pending',
        review TEXT,
        progress INT CHECK (progress >= 0 AND progress <= 100),
        CONSTRAINT fk_project_developer FOREIGN KEY (developerId) REFERENCES developer(developerId) ON DELETE SET NULL
      );
    `);

    // Module table
    await client.query(`
      CREATE TABLE IF NOT EXISTS module (
        moduleId SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        startDate DATE,
        endDate DATE,
        cost NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Pending',
        markedCompleteDate DATE,
        projectId INT NOT NULL,
        notes TEXT,
        commitLink VARCHAR(255),
        CONSTRAINT fk_module_project FOREIGN KEY (projectId) REFERENCES project(projectId) ON DELETE CASCADE
      );
    `);

    //add currency column to module table
    await client.query(`
      DO $$
      BEGIN
      --ADD CURRENCY COLUMN IF MISSING
      IF NOT EXISTS 
      (SELECT 1 FROM information_schema.columns WHERE table_name = 'module' AND column_name = 'currency') THEN
        ALTER TABLE module ADD COLUMN currency VARCHAR(3) DEFAULT 'UGX';
      END IF;
      END $$;
    `);

    // Finance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS finance (
        financeId SERIAL PRIMARY KEY,
        moduleId INT NOT NULL,
        processedBy VARCHAR(255),
        processedDate DATE DEFAULT CURRENT_DATE,
        paymentStatus VARCHAR(50) DEFAULT 'Pending',
        amount NUMERIC(12,2) DEFAULT 0, -- actual amount processed/paid
        moduleCost NUMERIC(12,2) DEFAULT 0, -- snapshot from module.cost
        notes TEXT,
        CONSTRAINT fk_finance_module FOREIGN KEY (moduleId) REFERENCES module(moduleId) ON DELETE CASCADE
      );
    `);

    //add currency column to finance table
    await client.query(`
      DO $$
      BEGIN
      --ADD CURRENCY COLUMN IF MISSING
      IF NOT EXISTS 
      (SELECT 1 FROM information_schema.columns WHERE table_name = 'finance' AND column_name = 'currency') THEN
        ALTER TABLE finance ADD COLUMN currency VARCHAR(3) DEFAULT 'UGX';
      END IF;
      END $$;
    `);

    // Ensure index exists on email on reg_users table for searching.
    const indexResult = await client.query(`
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'reg_users' 
        AND indexname = 'idx_reg_users_email'
    `);

    if (indexResult.rowCount === 0) {
      console.log("Creating index on email column for reg_users table.");
      await client.query(`CREATE INDEX idx_reg_users_email ON reg_users (email);`);
    }

    // ---------------------------
    // Indexes for performance
    // ---------------------------

    // developer
    await client.query(`CREATE INDEX IF NOT EXISTS idx_developer_email ON developer (email);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_developer_teamlead ON developer (assignedTeamLead);`);

    // team_lead
    await client.query(`CREATE INDEX IF NOT EXISTS idx_teamlead_email ON team_lead (email);`);

    // project
    await client.query(`CREATE INDEX IF NOT EXISTS idx_project_status ON project (status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_project_developer ON project (developerId);`);

    // module
    await client.query(`CREATE INDEX IF NOT EXISTS idx_module_status ON module (status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_module_project ON module (projectId);`);

    // finance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_finance_status ON finance (paymentStatus);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_finance_module ON finance (moduleId);`);

    // ---------------------------
    // Trigger: Auto insert into finance when module completed
    // ---------------------------
    await client.query(`
      CREATE OR REPLACE FUNCTION create_finance_record()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Only insert if status changes to 'Complete'
        IF NEW.status = 'Complete' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
          INSERT INTO finance (moduleId, moduleCost, currency, notes)
          VALUES (NEW.moduleId, NEW.cost, NEW.currency, 'Auto-created on module completion');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_module_complete_finance ON module;
      CREATE TRIGGER trg_module_complete_finance
      AFTER UPDATE ON module
      FOR EACH ROW
      EXECUTE FUNCTION create_finance_record();
    `);

    //console.log("✅ Database initialized");
    return { success: true, message: "Database initialized successfully." };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown database error";
    console.error("❌ Database init error:", errorMessage);
    return { success: false, message: "Database initialization failed.", error: errorMessage };
  } finally {
    client.release();
  }
}
