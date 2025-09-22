import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Helper function to verify JWT and check for CEO role
async function verifyCEO(request: NextRequest) {
    const cookieStore = cookies();
    const tokenCookie = request.cookies.get('authToken');

    if (!tokenCookie) {
        return { authenticated: false, authorized: false, error: 'Not authenticated', status: 401 };
    }

    try {
        const token = tokenCookie.value;
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        
        if (decoded.role !== 'CEO') {
            return { authenticated: true, authorized: false, error: 'Forbidden: Access is restricted to CEO.', status: 403 };
        }

        return { authenticated: true, authorized: true, user: decoded, status: 200 };
    } catch (error) {
        return { authenticated: false, authorized: false, error: 'Session expired or invalid', status: 401 };
    }
}

// GET: Fetch all projects with "Pending" status
export async function GET(request: NextRequest) {
    const auth = await verifyCEO(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = await db.connect();
    try {
        const result = await client.query("SELECT * FROM project WHERE status = 'Pending' ORDER BY projectId DESC");
        return NextResponse.json({ projects: result.rows }, { status: 200 });
    } catch (error) {
        console.error('Get Pending Projects error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

// PUT: Approve or Reject a project
export async function PUT(request: NextRequest) {
    const auth = await verifyCEO(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = await db.connect();
    try {
        const { projectId, status, review } = await request.json();

        if (!projectId || !status) {
            return NextResponse.json({ error: 'Missing required fields: projectId and status are required.' }, { status: 400 });
        }

        if (status !== 'Approved' && status !== 'Rejected') {
            return NextResponse.json({ error: 'Invalid status. Must be "Approved" or "Rejected".' }, { status: 400 });
        }

        if (status === 'Rejected' && (!review || review.trim() === '')) {
            return NextResponse.json({ error: 'A review reason is required for rejection.' }, { status: 400 });
        }

        const result = await client.query(
            'UPDATE project SET status = $1, review = $2 WHERE projectId = $3 AND status = \'Pending\' RETURNING *',
            [status, review || '', projectId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Project not found or already actioned.' }, { status: 404 });
        }

        return NextResponse.json({ project: result.rows[0] }, { status: 200 });

    } catch (error: any) {
        console.error('Approve/Reject Project error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
