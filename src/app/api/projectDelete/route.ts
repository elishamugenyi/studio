//delete existing projects and modules for fres start
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest){
    try
    {

        const client = await db.connect();
        const { projectId } = await request.json();

        // Delete modules associated with the project
        await client.query('DELETE FROM module WHERE projectId=$1', [projectId]);

        // Delete the project
        const result = await client.query('DELETE FROM project WHERE projectId=$1 RETURNING *', [projectId]);
        client.release();

        if (result.rows.length === 0) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        return NextResponse.json({ message: 'Project deleted', project: result.rows[0] }, { status: 200 });
    } catch (error) {
        console.error('Project delete error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
    /*
// GET: View projects (all, by ID, or progress stats)
export async function GET(request: NextRequest) {
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const getStats = searchParams.get('stats');

    try {
        const client = await db.connect();

        // Get project progress statistics
        if (getStats === 'true') {
             const statsResult = await client.query(`
                SELECT 
                    status, 
                    COUNT(*) as count 
                FROM project 
                GROUP BY status
            `);
            const progressResult = await client.query(`
                SELECT 
                    name, 
                    progress 
                FROM project 
                WHERE status = 'In Progress' OR status = 'On Track'
                ORDER BY progress DESC 
                LIMIT 5
            `);
             client.release();
             return NextResponse.json({ 
                statusCounts: statsResult.rows,
                topProgress: progressResult.rows
             }, { status: 200 });
        }

        // Get a single project by ID
        if (projectId) {
            const result = await client.query('SELECT * FROM project WHERE projectId = $1', [projectId]);
            client.release();
            if (result.rows.length === 0) {
                return NextResponse.json({ error: 'Project not found' }, { status: 404 });
            }
            return NextResponse.json({ project: result.rows[0] }, { status: 200 });
        }

        // Get all projects
        const result = await client.query('SELECT * FROM project ORDER BY projectId DESC');
        client.release();
        return NextResponse.json({ projects: result.rows }, { status: 200 });

    } catch (error) {
        console.error('Get projects error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}*/
