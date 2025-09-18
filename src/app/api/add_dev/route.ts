
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Helper function to verify JWT and check for Admin role
async function verifyAdmin(request: NextRequest) {
    const cookieStore = cookies();
    const tokenCookie = await(request.cookies.get('authToken'));

    if (!tokenCookie) {
        return { authenticated: false, authorized: false, error: 'Not authenticated', status: 401 };
    }

    try {
        const token = tokenCookie.value;
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        
        if (decoded.role !== 'Admin') {
            return { authenticated: true, authorized: false, error: 'Forbidden: Access is restricted to Admins.', status: 403 };
        }

        return { authenticated: true, authorized: true, user: decoded, status: 200 };
    } catch (error) {
        return { authenticated: false, authorized: false, error: 'Session expired or invalid', status: 401 };
    }
}

// POST: Create a new Developer
export async function POST(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = await db.connect();
    try {
        const { firstName, lastName, email, teamLeadId } = await request.json();

        if (!firstName || !lastName || !email || !teamLeadId) {
            return NextResponse.json({ error: 'Missing required fields: firstName, lastName, email, and teamLeadId are required.' }, { status: 400 });
        }

        // Check if email already exists
        const existingDev = await client.query('SELECT * FROM developer WHERE email = $1', [email]);
        if (existingDev.rows.length > 0) {
            return NextResponse.json({ error: 'A developer with this email already exists.' }, { status: 409 });
        }

        const result = await client.query(
            'INSERT INTO developer (firstName, lastName, email, assignedTeamLead) VALUES ($1, $2, $3, $4) RETURNING *',
            [firstName, lastName, email, teamLeadId]
        );

        return NextResponse.json({ developer: result.rows[0] }, { status: 201 });
    } catch (error: any) {
        console.error('Add Developer error:', error);
        if (error.code === '23503') { // Foreign key violation
            return NextResponse.json({ error: 'Invalid Team Lead ID. The specified Team Lead does not exist.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

// PUT: Update an existing Developer
export async function PUT(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const client = await db.connect();
    try {
        const { developerId, firstName, lastName, email, teamLeadId } = await request.json();

        if (!developerId) {
            return NextResponse.json({ error: 'developerId is required for updates.' }, { status: 400 });
        }

        const currentDevResult = await client.query('SELECT * FROM developer WHERE developerId = $1', [developerId]);
        if (currentDevResult.rows.length === 0) {
            return NextResponse.json({ error: 'Developer not found.' }, { status: 404 });
        }

        const currentDev = currentDevResult.rows[0];
        
        const updates = {
            firstname: firstName || currentDev.firstname,
            lastname: lastName || currentDev.lastname,
            email: email || currentDev.email,
            assignedteamlead: teamLeadId || currentDev.assignedteamlead,
        };

        const result = await client.query(
            'UPDATE developer SET firstName = $1, lastName = $2, email = $3, assignedTeamLead = $4 WHERE developerId = $5 RETURNING *',
            [updates.firstname, updates.lastname, updates.email, updates.assignedteamlead, developerId]
        );

        return NextResponse.json({ developer: result.rows[0] }, { status: 200 });

    } catch (error: any) {
        console.error('Update Developer error:', error);
        if (error.code === '23505') { // Unique constraint violation for email
             return NextResponse.json({ error: 'A developer with this email already exists.' }, { status: 409 });
        }
        if (error.code === '23503') { // Foreign key violation
            return NextResponse.json({ error: 'Invalid Team Lead ID. The specified Team Lead does not exist.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

// GET: Fetch all Developers
export async function GET(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = await db.connect();
    try {
        const result = await client.query('SELECT * FROM developer ORDER BY lastName, firstName');
        return NextResponse.json({ developers: result.rows }, { status: 200 });
    } catch (error) {
        console.error('Get Developers error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
