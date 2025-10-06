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

// GET: Fetch project progress reports for Team Lead
export async function GET(request: NextRequest) {
    const auth = await verifyTeamLead(request);
    if (!auth.authorized || !auth.user?.id) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = getDb();
    const client = await db.connect();
    try {
        const { searchParams } = new URL(request.url);
        const developerId = searchParams.get('developerId');
        const projectId = searchParams.get('projectId');

        let whereClause = 'WHERE p.createdBy = $1';
        let queryParams = [auth.user.id];
        let paramIndex = 2;

        // Add developer filter if specified
        if (developerId) {
            whereClause += ` AND d.developerid = $${paramIndex}`;
            queryParams.push(developerId);
            paramIndex++;
        }

        // Add project filter if specified
        if (projectId) {
            whereClause += ` AND p.projectid = $${paramIndex}`;
            queryParams.push(projectId);
            paramIndex++;
        }

        // Get detailed project progress with developer and module information
        const result = await client.query(`
            SELECT 
                p.projectid,
                p.name as project_name,
                p.description as project_description,
                p.status as project_status,
                p.createdby,
                d.developerid,
                d.firstname || ' ' || d.lastname as developer_name,
                d.email as developer_email,
                d.expertise as developer_expertise,
                COALESCE(module_stats.total_modules, 0) as total_modules,
                COALESCE(module_stats.completed_modules, 0) as completed_modules,
                COALESCE(module_stats.started_modules, 0) as started_modules,
                COALESCE(module_stats.pending_modules, 0) as pending_modules,
                CASE 
                    WHEN COALESCE(module_stats.total_modules, 0) = 0 THEN 0
                    ELSE ROUND((COALESCE(module_stats.completed_modules, 0)::float / module_stats.total_modules::float) * 100)
                END as progress_percentage,
                module_stats.module_details
            FROM project p
            LEFT JOIN developer d ON p.projectid = d.projectid
            LEFT JOIN (
                SELECT 
                    m.projectid,
                    COUNT(*) as total_modules,
                    COUNT(CASE WHEN m.status = 'Complete' THEN 1 END) as completed_modules,
                    COUNT(CASE WHEN m.status = 'Started' THEN 1 END) as started_modules,
                    COUNT(CASE WHEN m.status = 'Pending' THEN 1 END) as pending_modules,
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'moduleid', m.moduleid,
                            'name', m.name,
                            'description', m.description,
                            'status', m.status,
                            'startdate', m.startdate,
                            'enddate', m.enddate,
                            'markedcompletedate', m.markedcompletedate,
                            'commitlink', m.commitlink
                        ) ORDER BY m.moduleid
                    ) as module_details
                FROM module m
                GROUP BY m.projectid
            ) module_stats ON p.projectid = module_stats.projectid
            ${whereClause}
            ORDER BY p.projectid DESC, d.developerid ASC
        `, queryParams);

        // Get list of developers for filter dropdown
        const developersResult = await client.query(`
            SELECT DISTINCT 
                d.developerid,
                d.firstname || ' ' || d.lastname as developer_name,
                d.email as developer_email
            FROM developer d
            JOIN project p ON d.projectid = p.projectid
            WHERE p.createdBy = $1
            ORDER BY developer_name
        `, [auth.user.id]);

        // Get list of projects for filter dropdown
        const projectsResult = await client.query(`
            SELECT 
                projectid,
                name as project_name
            FROM project 
            WHERE createdBy = $1
            ORDER BY project_name
        `, [auth.user.id]);

        return NextResponse.json({ 
            reports: result.rows,
            developers: developersResult.rows,
            projects: projectsResult.rows
        }, { status: 200 });

    } catch (error) {
        console.error('Get Team Lead Reports error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
