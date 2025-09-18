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

// POST: Create a new Team Lead
export async function POST(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = await db.connect();
    try {
        const { firstName, lastName, email } = await request.json();

        if (!firstName || !lastName || !email) {
            return NextResponse.json({ error: 'Missing required fields: firstName, lastName, and email are required.' }, { status: 400 });
        }

        // Check if email already exists
        const existingLead = await client.query('SELECT * FROM team_lead WHERE email = $1', [email]);
        if (existingLead.rows.length > 0) {
            return NextResponse.json({ error: 'A team lead with this email already exists.' }, { status: 409 });
        }

        const result = await client.query(
            'INSERT INTO team_lead (firstName, lastName, email) VALUES ($1, $2, $3) RETURNING *',
            [firstName, lastName, email]
        );

        return NextResponse.json({ teamLead: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Add Team Lead error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

// PUT: Update an existing Team Lead
export async function PUT(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const client = await db.connect();
    try {
        const { teamLeadId, firstName, lastName, email } = await request.json();

        if (!teamLeadId) {
            return NextResponse.json({ error: 'teamLeadId is required for updates.' }, { status: 400 });
        }

        const currentLeadResult = await client.query('SELECT * FROM team_lead WHERE teamLeadId = $1', [teamLeadId]);
        if (currentLeadResult.rows.length === 0) {
            return NextResponse.json({ error: 'Team Lead not found.' }, { status: 404 });
        }

        const currentLead = currentLeadResult.rows[0];
        
        // Build the update query dynamically
        const updates = {
            firstname: firstName || currentLead.firstname,
            lastname: lastName || currentLead.lastname,
            email: email || currentLead.email,
        };

        const result = await client.query(
            'UPDATE team_lead SET firstName = $1, lastName = $2, email = $3 WHERE teamLeadId = $4 RETURNING *',
            [updates.firstname, updates.lastname, updates.email, teamLeadId]
        );

        return NextResponse.json({ teamLead: result.rows[0] }, { status: 200 });

    } catch (error: any) {
        console.error('Update Team Lead error:', error);
        if (error.code === '23505') { // Unique constraint violation for email
             return NextResponse.json({ error: 'A team lead with this email already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

// GET: Fetch all Team Leads
export async function GET(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = await db.connect();
    try {
        const result = await client.query('SELECT * FROM team_lead ORDER BY lastName, firstName');
        return NextResponse.json({ teamLeads: result.rows }, { status: 200 });
    } catch (error) {
        console.error('Get Team Leads error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}