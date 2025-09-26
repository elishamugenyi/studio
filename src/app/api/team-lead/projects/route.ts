import { db } from '@/lib/db';
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

// GET: Fetch projects created by the logged-in Team Lead
export async function GET(request: NextRequest) {
    const auth = await verifyTeamLead(request);
    if (!auth.authorized || !auth.user?.id) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = await db.connect();
    try {
        const result = await client.query('SELECT * FROM project WHERE createdBy = $1 ORDER BY projectId DESC', [auth.user.id]);
        return NextResponse.json({ projects: result.rows }, { status: 200 });
    } catch (error) {
        console.error('Get Team Lead Projects error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

// DELETE: Delete a project
export async function DELETE(request: NextRequest) {
    const auth = await verifyTeamLead(request);
    if (!auth.authorized || !auth.user?.id) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = await db.connect();
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required as a query parameter.' }, { status: 400 });
        }

        // Ensure the Team Lead can only delete projects they created
        const result = await client.query(
            'DELETE FROM project WHERE projectId = $1 AND createdBy = $2 RETURNING *',
            [projectId, auth.user.id]
        );
        
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Project not found or you do not have permission to delete it.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Project deleted successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('Delete Project error:', error);
        // Handle case where project has dependent modules
        if (error.code === '23503') { 
            return NextResponse.json({ error: 'Cannot delete project. It still has modules associated with it. Please delete the modules first.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
