
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Helper to verify JWT and ensure user is a Developer
async function verifyDeveloper(request: NextRequest) {
    const cookieStore = cookies();
    const tokenCookie = request.cookies.get('authToken');

    if (!tokenCookie) {
        return { authenticated: false, authorized: false, error: 'Not authenticated', status: 401 };
    }

    try {
        const token = tokenCookie.value;
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        
        if (decoded.role !== 'Developer') {
            return { authenticated: true, authorized: false, error: 'Forbidden: Access restricted to Developers.', status: 403 };
        }

        return { authenticated: true, authorized: true, user: decoded, status: 200 };
    } catch (error) {
        return { authenticated: false, authorized: false, error: 'Session expired or invalid', status: 401 };
    }
}

// POST: Create a new module
export async function POST(request: NextRequest) {
    const auth = await verifyDeveloper(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = await db.connect();
    try {
        const { name, description, startDate, endDate, cost, currency, projectId } = await request.json();

        if (!name || !description || !startDate || !endDate || cost === undefined || currency === undefined || !projectId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await client.query(
            `INSERT INTO module (name, description, startDate, endDate, cost, currency, projectId, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending') RETURNING *`,
            [name, description, startDate, endDate, cost, currency, projectId]
        );

        return NextResponse.json({ module: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Create Module error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

// PUT: Update a module (e.g., mark as complete)
export async function PUT(request: NextRequest) {
    const auth = await verifyDeveloper(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const client = await db.connect();
    try {
        const { moduleId, status, commitLink } = await request.json();

        if (!moduleId || !status) {
            return NextResponse.json({ error: 'moduleId and status are required.' }, { status: 400 });
        }
        
        if (status === 'Complete' && !commitLink) {
             return NextResponse.json({ error: 'A commit link is required to mark a module as complete.' }, { status: 400 });
        }

        // We also need to update the markedCompleteDate
        const markedCompleteDate = status === 'Complete' ? new Date() : null;

        const result = await client.query(
            'UPDATE module SET status = $1, commitLink = $2, markedCompleteDate = $3 WHERE moduleId = $4 RETURNING *',
            [status, commitLink || null, markedCompleteDate, moduleId]
        );
        
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Module not found.' }, { status: 404 });
        }

        return NextResponse.json({ module: result.rows[0] }, { status: 200 });

    } catch (error) {
        console.error('Update Module error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

// DELETE: Delete a module
export async function DELETE(request: NextRequest) {
    const auth = await verifyDeveloper(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const client = await db.connect();
    try {
        const { searchParams } = new URL(request.url);
        const moduleId = searchParams.get('moduleId');

        if (!moduleId) {
            return NextResponse.json({ error: 'moduleId is required as a query parameter.' }, { status: 400 });
        }

        const result = await client.query('DELETE FROM module WHERE moduleId = $1 RETURNING *', [moduleId]);
        
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Module not found.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Module deleted successfully.' }, { status: 200 });

    } catch (error) {
        console.error('Delete Module error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
