import { getDb } from "@/lib/db";

// Initialize and manage database schema
export async function initDb({ drop = false } = {}) {
  // Skip database initialization during build time if DATABASE_URL is not available
  if (!process.env.DATABASE_URL) {
    console.log("⚠️ DATABASE_URL not found, skipping database initialization (likely during build time)");
    return { success: false, message: "Database URL not configured", error: "DATABASE_URL missing" };
  }

  let client;
  try {
    console.log("🔌 Connecting to database...");
    const db = getDb();
    client = await db.connect();
    console.log("✅ Database connection established");
    if (drop) {
      console.log("⚠️ Dropping existing tables...");
      await client.query(`
        --DROP TABLE IF EXISTS finance CASCADE;
        --DROP TABLE IF EXISTS module CASCADE;
        --DROP TABLE IF EXISTS developer CASCADE;
        --DROP TABLE IF EXISTS team_lead CASCADE;
        --DROP TABLE IF EXISTS project CASCADE;
      `);
    }

    // Create reg-users table if it doesn't exist
    console.log("📋 Creating reg_users table...");
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
    console.log("👥 Creating team_lead table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_lead (
        teamLeadId SERIAL PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL
      );
    `);
    
    // Project table
    console.log("📁 Creating project table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS project (
        projectId SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Pending',
        review TEXT,
        progress INT CHECK (progress >= 0 AND progress <= 100)
        -- added createdby column here(reference regID from reg_users)
      );
    `);
    
    // Ensure createdBy column + FK on project
    await client.query(`
      DO $$
      BEGIN
        -- 1. Add column if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'project' AND column_name = 'createdby'
        ) THEN
          ALTER TABLE project ADD COLUMN createdBy INT;
        END IF;
      
        -- 2. Drop constraint if it already exists (safety)
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_project_createdby'
        ) THEN
          ALTER TABLE project DROP CONSTRAINT fk_project_createdby;
        END IF;
      
        -- 3. Re-add the FK constraint if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_project_createdby'
        ) THEN
          ALTER TABLE project 
            ADD CONSTRAINT fk_project_createdby
            FOREIGN KEY (createdby) REFERENCES reg_users(regid) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
          
    // Developer table, projectId will be moved to this table
    console.log("👨‍💻 Creating developer table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS developer (
        developerId SERIAL PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        expertise VARCHAR(255),
        department VARCHAR(255),
        assignedTeamLead INT,
        --added projectId column here and ref it to project table
        CONSTRAINT fk_dev_team_lead FOREIGN KEY (assignedTeamLead) REFERENCES team_lead(teamLeadId) ON DELETE SET NULL
      );
    `);

    // Migrate project-developer relationship to one-to-many
    await client.query(`
      DO $$
      BEGIN
        -- 1. Add projectId to developer if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'developer' AND column_name = 'projectid'
        ) THEN
          ALTER TABLE developer ADD COLUMN projectId INT;
        END IF;

        -- 2. Migrate data: copy project.developerId -> developer.projectId
        -- Only run if project.developerId exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'project' AND column_name = 'developerid'
        ) THEN
          UPDATE developer d
          SET projectId = p.projectId
          FROM project p
          WHERE p.developerId = d.developerId;
        END IF;

        -- 3. Drop developerId and developerName from project (no longer needed)
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'project' AND column_name = 'developerid'
        ) THEN
          ALTER TABLE project DROP COLUMN developerId;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'project' AND column_name = 'developername'
        ) THEN
          ALTER TABLE project DROP COLUMN developerName;
        END IF;

        -- 4. Add FK from developer.projectId → project.projectId if not exists
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_developer_project'
        ) THEN
          ALTER TABLE developer
          ADD CONSTRAINT fk_developer_project
          FOREIGN KEY (projectId) REFERENCES project(projectId)
          ON DELETE SET NULL;
        END IF;
      END $$;
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
        --added currency column here
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

    //add createBy column to module table.
    await client.query(`
      DO $$
      BEGIN
      -- 1. ADD CreatedBy COLUMN IF MISSING
      IF NOT EXISTS 
      (SELECT 1 FROM information_schema.columns WHERE table_name = 'module' AND column_name = 'createdby') THEN
        ALTER TABLE module ADD COLUMN createdBy INT;
      END IF;
      
      -- 2. Convert existing createdby column from UUID to INT if needed
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'module' 
        AND column_name = 'createdby' 
        AND data_type = 'uuid'
      ) THEN
        -- First drop the foreign key constraint if it exists
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_module_createdby') THEN
          ALTER TABLE module DROP CONSTRAINT fk_module_createdby;
        END IF;
        
        -- Add a temporary column
        ALTER TABLE module ADD COLUMN createdby_temp INT;
        
        -- Copy data from UUID to INT (this will need to be handled carefully)
        -- For now, we'll set it to NULL and let new records populate correctly
        UPDATE module SET createdby_temp = NULL;
        
        -- Drop the old column and rename the new one
        ALTER TABLE module DROP COLUMN createdBy;
        ALTER TABLE module RENAME COLUMN createdby_temp TO createdBy;
      END IF;

      -- 3. Add constraint if missing
      IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'fk_module_createdby'
      ) THEN
        ALTER TABLE module 
        ADD CONSTRAINT fk_module_createdby
        FOREIGN KEY (createdBy) 
        REFERENCES developer(developerId) 
        ON DELETE SET NULL;
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
      //console.log("Creating index on email column for reg_users table.");
      await client.query(`CREATE INDEX idx_reg_users_email ON reg_users (email);`);
    }

    // ---------------------------
    // Indexes for performance
    // ---------------------------

    // developer
    await client.query(`CREATE INDEX IF NOT EXISTS idx_developer_email ON developer (email);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_developer_teamlead ON developer (assignedTeamLead);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_developer_project ON developer (projectId);`);

    // team_lead
    await client.query(`CREATE INDEX IF NOT EXISTS idx_teamlead_email ON team_lead (email);`);

    // project
    await client.query(`CREATE INDEX IF NOT EXISTS idx_project_status ON project (status);`);

    // module
    await client.query(`CREATE INDEX IF NOT EXISTS idx_module_status ON module (status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_module_project ON module (projectId);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_module_createdby ON module (createdby);`);

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
          -- check if record already exists
          IF NOT EXISTS 
            (SELECT 1 FROM finance WHERE moduleId = NEW.moduleId) THEN
              INSERT INTO finance (moduleId, moduleCost, currency, notes)
              VALUES (NEW.moduleId, NEW.cost, NEW.currency, 'Auto-created on module completion');
          END IF;
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
    console.error("❌ Database init error:", error);
    console.error("❌ Error details:", errorMessage);
    if (error instanceof Error && error.stack) {
      console.error("❌ Stack trace:", error.stack);
    }
    return { success: false, message: "Database initialization failed.", error: errorMessage };
  } finally {
    if (client) {
      client.release();
    }
  }
}
