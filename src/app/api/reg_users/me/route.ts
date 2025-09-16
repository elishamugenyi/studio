import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const tokenCookie = cookieStore.get('authToken');

        if (!tokenCookie) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        
        const token = tokenCookie.value;

        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        
        // We can trust the data in the token, no need to query the DB again
        return NextResponse.json({ user: decoded }, { status: 200 });

    } catch (error) {
        console.error('Me route error:', error);
        // This will happen if the token is invalid or expired
        return NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
    }
}
