
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

// GET: Fetch projects and modules for the logged-in developer
export async function GET(request: NextRequest) {
    const auth = await verifyDeveloper(request);
    if (!auth.authorized || !auth.user?.email) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const client = await db.connect();
    try {
        // First, get the developerId from the email in the JWT
        const devResult = await client.query('SELECT developerid FROM developer WHERE email = $1', [auth.user.email]);
        if (devResult.rows.length === 0) {
            return NextResponse.json({ error: 'Developer profile not found.' }, { status: 404 });
        }
        const developerId = devResult.rows[0].developerid;

        // Fetch projects assigned to this developer
        const projectsResult = await client.query('SELECT * FROM project WHERE developerId = $1 ORDER BY projectId DESC', [developerId]);
        const projects = projectsResult.rows;

        // For each project, fetch its modules
        const projectsWithModules = await Promise.all(
            projects.map(async (project) => {
                const modulesResult = await client.query('SELECT * FROM module WHERE projectId = $1 ORDER BY moduleId ASC', [project.projectid]);
                return { ...project, modules: modulesResult.rows };
            })
        );
        
        return NextResponse.json({ projects: projectsWithModules }, { status: 200 });

    } catch (error) {
        console.error('Get My Projects error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
