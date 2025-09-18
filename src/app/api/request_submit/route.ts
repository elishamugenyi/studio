//this is the route to handle project creation, update, view
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Helper function to verify JWT and get user data
async function verifyAuth(request: NextRequest) {
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('authToken');

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

// POST: Create a new project
export async function POST(request: NextRequest) {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Role check: Only CEO or Team Lead can create projects
    if (auth.user.role !== 'CEO' && auth.user.role !== 'Team Lead') {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to create projects.' }, { status: 403 });
    }

    try {
        const { name, description, duration, developerId, developerName } = await request.json();

        if (!name || !description || !duration || !developerId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await db.connect();
        const result = await client.query(
            'INSERT INTO project (name, description, duration, developerId, developerName, status, progress) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, description, duration, parseInt(developerId), developerName, 'Pending', 0]
        );
        client.release();

        return NextResponse.json({ project: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Project creation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


// PUT: Update an existing project
export async function PUT(request: NextRequest) {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.user) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    // Role check: Only CEO or Team Lead can update projects
    if (auth.user.role !== 'CEO' && auth.user.role !== 'Team Lead') {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to update projects.' }, { status: 403 });
    }

    try {
        const { projectId, ...updates } = await request.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        const client = await db.connect();
        
        // Fetch current project to avoid overwriting with nulls
        const currentProjectResult = await client.query('SELECT * FROM project WHERE projectId = $1', [projectId]);
        if (currentProjectResult.rows.length === 0) {
            client.release();
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const currentProject = currentProjectResult.rows[0];
        const newProjectData = { ...currentProject, ...updates };

        const { name, description, duration, developerId, developerName, status, review, progress } = newProjectData;

        const result = await client.query(
            `UPDATE project SET 
                name = $1, 
                description = $2, 
                duration = $3, 
                developerId = $4, 
                developerName = $5, 
                status = $6, 
                review = $7, 
                progress = $8 
            WHERE projectId = $9 RETURNING *`,
            [name, description, duration, developerId, developerName, status, review, progress, projectId]
        );
        client.release();

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({ project: result.rows[0] }, { status: 200 });

    } catch (error) {
        console.error('Project update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET: View projects (all, by ID, or progress stats)
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

        // Get project progress statistics
        if (getStats === 'true') {
             const statsResult = await client.query(`
                SELECT 
                    status, 
                    COUNT(*) as count 
                FROM project 
                GROUP BY status
            `);
            const progressResult = await client.query(`
                SELECT 
                    name, 
                    progress 
                FROM project 
                WHERE status = 'In Progress' OR status = 'On Track'
                ORDER BY progress DESC 
                LIMIT 5
            `);
             client.release();
             return NextResponse.json({ 
                statusCounts: statsResult.rows,
                topProgress: progressResult.rows
             }, { status: 200 });
        }

        // Get a single project by ID
        if (projectId) {
            const result = await client.query('SELECT * FROM project WHERE projectId = $1', [projectId]);
            client.release();
            if (result.rows.length === 0) {
                return NextResponse.json({ error: 'Project not found' }, { status: 404 });
            }
            return NextResponse.json({ project: result.rows[0] }, { status: 200 });
        }

        // Get all projects
        const result = await client.query('SELECT * FROM project ORDER BY projectId DESC');
        client.release();
        return NextResponse.json({ projects: result.rows }, { status: 200 });

    } catch (error) {
        console.error('Get projects error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
