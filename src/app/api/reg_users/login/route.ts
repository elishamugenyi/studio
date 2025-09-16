import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const client = await db.connect();
        const result = await client.query('SELECT * FROM reg_users WHERE email = $1', [email]);
        client.release();

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = result.rows[0];

        if (!user.password) {
            return NextResponse.json({ error: 'Account not fully set up. Please complete sign-up.' }, { status: 401 });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const userPayload = {
            id: user.regid,
            firstName: user.firstname,
            lastName: user.lastname,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(userPayload, process.env.JWT_SECRET!, {
            expiresIn: '2h',
        });

        const cookie = serialize('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 60 * 60 * 2, // 2 hours
            path: '/',
        });

        const response = NextResponse.json({ success: true, user: userPayload }, { status: 200 });
        response.headers.set('Set-Cookie', cookie);

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
