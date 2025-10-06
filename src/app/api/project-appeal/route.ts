import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Helper function to verify JWT and check for Team Lead role
async function verifyTeamLead(request: NextRequest) {
    const cookieStore = cookies();
    const tokenCookie = request.cookies.get('authToken');

    if (!tokenCookie) {
        return { authenticated: false, authorized: false, error: 'Not authenticated', status: 401 };
    }

    try {
        const token = tokenCookie.value;
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        
        if (decoded.role !== 'Team Lead') {
            return { authenticated: true, authorized: false, error: 'Forbidden: Access is restricted to Team Leads.', status: 403 };
        }

        return { authenticated: true, authorized: true, user: decoded, status: 200 };
    } catch (error) {
        return { authenticated: false, authorized: false, error: 'Session expired or invalid', status: 401 };
    }
}

// POST: Appeal a rejected project
export async function POST(request: NextRequest) {
    const auth = await verifyTeamLead(request);
    if (!auth.authorized || !auth.user?.id) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = getDb();
    const client = await db.connect();
    try {
        const { projectId, name, description, duration, appealresponse } = await request.json();

        if (!projectId || !name || !description) {
            return NextResponse.json({ error: 'Missing required fields: projectId, name, and description are required.' }, { status: 400 });
        }

        // Check if project exists and is rejected
        const projectResult = await client.query(
            'SELECT * FROM project WHERE projectid = $1 AND status = $2 AND createdby = $3',
            [projectId, 'Rejected', auth.user.id]
        );

        if (projectResult.rows.length === 0) {
            return NextResponse.json({ 
                error: 'Project not found, not rejected, or you do not have permission to appeal it.' 
            }, { status: 404 });
        }

        const project = projectResult.rows[0];
        const originalReview = project.review || '';

        // Update project with new details and change status back to Pending
        const updateResult = await client.query(
            `UPDATE project 
             SET name = $1, description = $2, duration = $3, status = $4, review = $5
             WHERE projectid = $6 
             RETURNING *`,
            [
                name, 
                description, 
                duration || '', 
                'Pending',
                `ORIGINAL REVIEW: ${originalReview}\n\nAPPEAL RESPONSE: ${appealresponse || 'No additional response provided.'}`,
                projectId
            ]
        );

        return NextResponse.json({ 
            message: 'Project appeal submitted successfully. The project has been resubmitted for review.',
            project: updateResult.rows[0]
        }, { status: 200 });

    } catch (error: any) {
        console.error('Project Appeal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

// GET: Get project details for appeal (including review)
export async function GET(request: NextRequest) {
    const auth = await verifyTeamLead(request);
    if (!auth.authorized || !auth.user?.id) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
    }

    const db = getDb();
    const client = await db.connect();
    try {
        const result = await client.query(
            'SELECT * FROM project WHERE projectid = $1 AND status = $2 AND createdby = $3',
            [projectId, 'Rejected', auth.user.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ 
                error: 'Project not found, not rejected, or you do not have permission to view it.' 
            }, { status: 404 });
        }

        return NextResponse.json({ project: result.rows[0] }, { status: 200 });

    } catch (error: any) {
        console.error('Get Project for Appeal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
