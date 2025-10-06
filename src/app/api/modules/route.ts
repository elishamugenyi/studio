
import { getDb } from '@/lib/db';
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

    const db = getDb();
    const client = await db.connect();
    try {
        const { name, description, startDate, endDate, cost, currency, projectId } = await request.json();

        if (!name || !description || !startDate || !endDate || cost === undefined || currency === undefined || !projectId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await client.query(
            `INSERT INTO module (name, description, startdate, enddate, cost, currency, projectid, status) 
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

// GET: Get all modules for a project or dashboard stats
export async function GET(request: NextRequest) {
    const auth = await verifyDeveloper(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = getDb();
    const client = await db.connect();
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const dashboard = searchParams.get('dashboard');
        
        // If dashboard stats requested
        if (dashboard === 'true' && auth.user?.email) {
            // Get developer's modules from their assigned projects
            const result = await client.query(`
                SELECT m.*, p.name as project_name
                FROM module m
                JOIN project p ON m.projectid = p.projectid
                JOIN developer d ON p.projectid = d.projectid
                WHERE d.email = $1 AND m.status IN ('Started', 'Pending')
                ORDER BY m.enddate ASC
            `, [auth.user.email]);
            
            const modules = result.rows;
            const now = new Date();
            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const threeWeeksFromNow = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
            const fourWeeksFromNow = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
            
            // Calculate this week's start and end
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            // Calculate last week's start and end
            const startOfLastWeek = new Date(startOfWeek);
            startOfLastWeek.setDate(startOfWeek.getDate() - 7);
            
            const endOfLastWeek = new Date(endOfWeek);
            endOfLastWeek.setDate(endOfWeek.getDate() - 7);
            
            // Get completed modules this week
            const completedThisWeekResult = await client.query(`
                SELECT COUNT(*) as count
                FROM module m
                JOIN project p ON m.projectid = p.projectid
                JOIN developer d ON p.projectid = d.projectid
                WHERE d.email = $1 AND m.status = 'Complete' 
                AND m.markedcompletedate >= $2 AND m.markedcompletedate <= $3
            `, [auth.user.email, startOfWeek, endOfWeek]);
            
            // Get completed modules last week
            const completedLastWeekResult = await client.query(`
                SELECT COUNT(*) as count
                FROM module m
                JOIN project p ON m.projectid = p.projectid
                JOIN developer d ON p.projectid = d.projectid
                WHERE d.email = $1 AND m.status = 'Complete' 
                AND m.markedcompletedate >= $2 AND m.markedcompletedate <= $3
            `, [auth.user.email, startOfLastWeek, endOfLastWeek]);
            
            const completedThisWeek = parseInt(completedThisWeekResult.rows[0].count);
            const completedLastWeek = parseInt(completedLastWeekResult.rows[0].count);
            const percentageChange = completedLastWeek > 0 ? 
                Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100) : 0;
            
            // Categorize modules by priority
            const modulesWithPriority = modules.map(module => {
                const endDate = new Date(module.enddate);
                let priority = 'Low';
                
                if (endDate <= oneWeekFromNow) {
                    priority = 'High';
                } else if (endDate <= threeWeeksFromNow) {
                    priority = 'Medium';
                } else if (endDate <= fourWeeksFromNow) {
                    priority = 'Low';
                }
                
                return {
                    ...module,
                    priority,
                    dueDate: module.enddate
                };
            });
            
            const stats = {
                activeModules: modules.filter(m => m.status === 'Started').length,
                pendingModules: modules.filter(m => m.status === 'Pending').length,
                dueSoon: modules.filter(m => new Date(m.enddate) <= oneWeekFromNow).length,
                completedThisWeek: completedThisWeek,
                completedLastWeek: completedLastWeek,
                percentageChange: percentageChange
            };
            
            return NextResponse.json({ 
                modules: modulesWithPriority,
                stats: stats
            }, { status: 200 });
        }
        
        // Regular project modules request
        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
        }
        const result = await client.query('SELECT * FROM module WHERE projectid = $1', [projectId]);
        return NextResponse.json({ modules: result.rows }, { status: 200 });
    } catch (error) {
        console.error('Get Modules error:', error);
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
    
    const db = getDb();
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
            'UPDATE module SET status = $1, commitlink = $2, markedcompletedate = $3 WHERE moduleid = $4 RETURNING *',
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

//PATCH: UPDATE MODULE TO STARTED STATUS
export async function PATCH(request: NextRequest) {
    const auth = await verifyDeveloper(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    const db = getDb();
    const client = await db.connect();
    try {
        const { moduleId } = await request.json();
        if (!moduleId) {
            return NextResponse.json({ error: 'moduleId is required.' }, { status: 400 });
        }
        const result = await client.query('UPDATE module SET status = $1 WHERE moduleid = $2 RETURNING *', ['Started', moduleId]);
        return NextResponse.json({ module: result.rows[0] }, { status: 200 });
    } catch (error) {
        console.error('Update Module to Started status error:', error);
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
    
    const db = getDb();
    const client = await db.connect();
    try {
        const { searchParams } = new URL(request.url);
        const moduleId = searchParams.get('moduleId');

        if (!moduleId) {
            return NextResponse.json({ error: 'moduleId is required as a query parameter.' }, { status: 400 });
        }

        const result = await client.query('DELETE FROM module WHERE moduleid = $1 RETURNING *', [moduleId]);
        
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
