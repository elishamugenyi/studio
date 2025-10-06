import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Helper function to verify JWT and check for Finance role
async function verifyFinance(request: NextRequest) {
    const cookieStore = cookies();
    const tokenCookie = request.cookies.get('authToken');

    if (!tokenCookie) {
        return { authenticated: false, authorized: false, error: 'Not authenticated', status: 401 };
    }

    try {
        const token = tokenCookie.value;
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        
        if (decoded.role !== 'Finance') {
            return { authenticated: true, authorized: false, error: 'Forbidden: Access is restricted to Finance.', status: 403 };
        }

        return { authenticated: true, authorized: true, user: decoded, status: 200 };
    } catch (error) {
        return { authenticated: false, authorized: false, error: 'Session expired or invalid', status: 401 };
    }
}

// GET: Fetch completed modules awaiting payment processing
export async function GET(request: NextRequest) {
    const auth = await verifyFinance(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = getDb();
    const client = await db.connect();
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'Pending';
        const report = searchParams.get('report') === 'true';

        if (report) {
            // Generate financial reports
            const result = await client.query(`
                SELECT 
                    f.*,
                    m.name as module_name,
                    m.description as module_description,
                    m.startdate,
                    m.enddate,
                    m.markedcompletedate,
                    p.name as project_name,
                    d.firstname || ' ' || d.lastname as developer_name,
                    d.email as developer_email,
                    f.processedby as processed_by_name
                FROM finance f
                JOIN module m ON f.moduleid = m.moduleid
                JOIN project p ON m.projectid = p.projectid
                JOIN developer d ON m.createdby = d.developerid
                ORDER BY f.processeddate DESC, f.financeid DESC
            `);
            
            // Calculate summary statistics
            const summaryResult = await client.query(`
                SELECT 
                    COUNT(*) as total_payments,
                    COUNT(CASE WHEN paymentstatus = 'Paid' THEN 1 END) as paid_count,
                    COUNT(CASE WHEN paymentstatus = 'Pending' THEN 1 END) as pending_count,
                    COUNT(CASE WHEN paymentstatus = 'Rejected' THEN 1 END) as rejected_count,
                    COALESCE(SUM(CASE WHEN paymentstatus = 'Paid' THEN amount ELSE 0 END), 0) as total_paid_amount,
                    COALESCE(SUM(CASE WHEN paymentstatus = 'Pending' THEN modulecost ELSE 0 END), 0) as total_pending_amount,
                    COALESCE(SUM(modulecost), 0) as total_module_costs
                FROM finance
            `);

            return NextResponse.json({ 
                payments: result.rows,
                summary: summaryResult.rows[0]
            }, { status: 200 });
        }

        // Get completed modules awaiting payment
        const result = await client.query(`
            SELECT 
                f.*,
                m.name as module_name,
                m.description as module_description,
                m.startdate,
                m.enddate,
                m.markedcompletedate,
                p.name as project_name,
                d.firstname || ' ' || d.lastname as developer_name,
                d.email as developer_email
            FROM finance f
            JOIN module m ON f.moduleid = m.moduleid
            JOIN project p ON m.projectid = p.projectid
            JOIN developer d ON m.createdby = d.developerid
            WHERE f.paymentstatus = $1
            ORDER BY f.processeddate DESC, f.financeid DESC
        `, [status]);

        return NextResponse.json({ payments: result.rows }, { status: 200 });

    } catch (error) {
        console.error('Get Finance Data error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}

// PATCH: Process payment (approve/reject)
export async function PATCH(request: NextRequest) {
    const auth = await verifyFinance(request);
    if (!auth.authorized || !auth.user?.email) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = getDb();
    const client = await db.connect();
    try {
        const { financeId, paymentStatus, amount, notes } = await request.json();

        if (!financeId || !paymentStatus) {
            return NextResponse.json({ error: 'financeId and paymentStatus are required.' }, { status: 400 });
        }

        if (!['Paid', 'Rejected'].includes(paymentStatus)) {
            return NextResponse.json({ error: 'paymentStatus must be either "Paid" or "Rejected".' }, { status: 400 });
        }

        // Update payment status
        const result = await client.query(
            `UPDATE finance 
             SET paymentstatus = $1, 
                 amount = $2, 
                 processedby = $3, 
                 processeddate = CURRENT_DATE,
                 notes = $4
             WHERE financeid = $5 
             RETURNING *`,
            [paymentStatus, amount || 0, auth.user.email, notes || '', financeId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
        }

        return NextResponse.json({ 
            message: `Payment ${paymentStatus.toLowerCase()} successfully.`,
            payment: result.rows[0]
        }, { status: 200 });

    } catch (error: any) {
        console.error('Process Payment error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
