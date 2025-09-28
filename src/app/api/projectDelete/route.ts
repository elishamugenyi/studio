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