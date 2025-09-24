
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Helper function to verify JWT
async function verifyAuth(request: NextRequest) {
    const cookieStore = cookies();
    const tokenCookie = await(request.cookies.get('authToken'));

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

// GET: Fetch all approved projects with joins
export async function GET(request: NextRequest) {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = await db.connect();
    try {
        // This query joins project with developer and team_lead to get all necessary info
        const query = `
            SELECT
                p.projectId,
                p.name AS "projectName",
                p.description,
                p.duration,
                p.status,
                p.progress,
                p.developerName,
                CONCAT(tl.firstName, ' ', tl.lastName) AS "teamLeadName"
            FROM
                project p
            LEFT JOIN
                developer d ON p.developerId = d.developerId
            LEFT JOIN
                team_lead tl ON d.assignedTeamLead = tl.teamLeadId
            WHERE
                p.status = 'Approved'
            ORDER BY
                p.projectId DESC;
        `;
        
        const result = await client.query(query);
        return NextResponse.json({ projects: result.rows }, { status: 200 });
    } catch (error) {
        console.error('Get Approved Projects error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
