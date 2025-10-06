import { NextRequest, NextResponse } from 'next/server';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { initDb } from '@/lib/dbInit';

export async function POST(request: NextRequest) {
    try {
        console.log('🔧 Starting database initialization...');
        
        const result = await initDb({ drop: false });
        
        if (result.success) {
            console.log('✅ Database initialization completed successfully');
            return NextResponse.json({ 
                success: true, 
                message: result.message 
            }, { status: 200 });
        } else {
            console.error('❌ Database initialization failed:', result.error);
            return NextResponse.json({ 
                success: false, 
                message: result.message,
                error: result.error 
            }, { status: 500 });
        }
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Database initialization failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({ 
        message: 'Database initialization endpoint. Use POST to initialize the database.',
        usage: 'POST /api/db/init'
    }, { status: 200 });
}
