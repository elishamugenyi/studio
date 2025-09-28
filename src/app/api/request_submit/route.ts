
//this is the route to handle project creation, update, view
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/* ============ AUTH HELPER ============ */
async function verifyAuth(request: NextRequest) {
    const cookieStore = cookies();
    const tokenCookie = request.cookies.get('authToken');

    if (!tokenCookie) {
        return { authenticated: false, error: 'Not authenticated', status: 401 };
    }

    try {
        const token = tokenCookie.value;
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        return { authenticated: true, user: decoded, status: 200 };
    } catch (error) {
        return { authenticated: false, error: 'Session expired or invalid', status: 401 };
    }
}

/* ============ POST: Create Project ============ */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.user.role !== 'CEO' && auth.user.role !== 'Team Lead') {
    return NextResponse.json({ error: 'Forbidden: Only CEO/Team Lead can create projects.' }, { status: 403 });
  }

  const client = await db.connect();
  try {
    const { name, description, duration, developerIds } = await request.json();

    if (!name || !description || !duration || !Array.isArray(developerIds) || developerIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: name, description, duration, and at least one developerId are required.' }, { status: 400 });
    }

    // Since we are creating a project for each developer, we'll loop through the ids
    const createdProjects = [];

    for (const developerId of developerIds) {
      const createdBy = auth.user.id;
      // Step 1: Create project
      const projectResult = await client.query(
        `INSERT INTO project (name, description, duration, status, review, progress, createdBy) 
         VALUES ($1, $2, $3, 'Pending', '', 0, $4) RETURNING *`,
        [name, description, duration, createdBy]
      );
      const project = projectResult.rows[0];

      // Step 2: Assign the developer to the new project
      await client.query(
        `UPDATE developer SET projectId = $1 WHERE developerId = $2`,
        [project.projectid, developerId]
      );
      
      createdProjects.push(project);
    }
    
    // In this model, each developer gets a new project.
    // We can return all projects that were created.
    return NextResponse.json({ projects: createdProjects }, { status: 201 });

  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}

/* ============ PUT: Update Project ============ */
export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.user.role !== 'CEO' && auth.user.role !== 'Team Lead') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { projectId, developerIds, ...updates } = await request.json();
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const client = await db.connect();

    // ✅ Update project core fields
    const current = await client.query('SELECT * FROM project WHERE projectId = $1', [projectId]);
    if (current.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const merged = { ...current.rows[0], ...updates };
    const { name, description, duration, status, review, progress } = merged;

    const result = await client.query(
      `UPDATE project 
       SET name=$1, description=$2, duration=$3, status=$4, review=$5, progress=$6
       WHERE projectId=$7 RETURNING *`,
      [name, description, duration, status, review, progress, projectId]
    );

    // ✅ Update developer assignments (if provided)
    if (Array.isArray(developerIds)) {
      // First clear existing developers on this project
      await client.query(`UPDATE developer SET projectId = NULL WHERE projectId = $1`, [projectId]);
      // Then assign new ones
      if (developerIds.length > 0) {
        await client.query(
          `UPDATE developer SET projectId = $1 WHERE developerId = ANY($2::int[])`,
          [projectId, developerIds]
        );
      }
    }

    client.release();
    return NextResponse.json({ project: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/* ============ GET: Fetch Projects ============ */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const getStats = searchParams.get('stats');

  try {
    const client = await db.connect();

    //project progress stats
    if (getStats === 'true') {
      const stats = await client.query(`SELECT status, COUNT(*) FROM project GROUP BY status`);
      const progress = await client.query(`
        SELECT name, progress FROM project 
        WHERE status IN ('In Progress','On Track') 
        ORDER BY progress DESC LIMIT 5
      `);
      client.release();
      return NextResponse.json({ statusCounts: stats.rows, topProgress: progress.rows }, { status: 200 });
    }

    //single project by ID
    if (projectId) {
        const result = await client.query(`
            SELECT p.*, r.firstName AS createdByFirstName, r.lastName AS createdByLastName, r.email AS createdByEmail
            FROM project p
            LEFT JOIN reg_users r ON p.createdBy = r.regID
            WHERE p.projectId = $1
          `, [projectId]);
    
      client.release();
      if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ project: result.rows[0] }, { status: 200 });
    }

    // All projects
    const result = await client.query(`
        SELECT p.*, r.firstName AS createdByFirstName, r.lastName AS createdByLastName, r.email AS createdByEmail
        FROM project p
        LEFT JOIN reg_users r ON p.createdBy = r.regID
        ORDER BY p.projectId DESC
      `);
    client.release();
    return NextResponse.json({ projects: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/* ============ DELETE: Remove Project ============ */
export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.user.role !== 'CEO' && auth.user.role !== 'Team Lead') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const client = await db.connect();

    // Clear developers assigned to this project
    await client.query(`UPDATE developer SET projectId = NULL WHERE projectId = $1`, [projectId]);

    const result = await client.query('DELETE FROM project WHERE projectId=$1 RETURNING *', [projectId]);
    client.release();

    if (result.rows.length === 0) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json({ message: 'Project deleted', project: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Project delete error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
