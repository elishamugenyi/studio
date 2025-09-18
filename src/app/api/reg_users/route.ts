//this is the route to handle new user creation
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { validateUserInput } from '@/lib/validator';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function verifyAdmin(request: NextRequest) {
    const cookieStore = cookies();
    const tokenCookie = await(request.cookies.get('authToken'));

    if (!tokenCookie) {
        return { authenticated: false, error: 'Not authenticated', status: 401 };
    }

    try {
        const token = tokenCookie.value;
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        if (decoded.role !== 'Admin') {
            return { authenticated: false, error: 'Forbidden: Admin access required', status: 403 };
        }
        return { authenticated: true, user: decoded, status: 200 };
    } catch (error) {
        return { authenticated: false, error: 'Session expired or invalid', status: 401 };
    }
}


export async function POST(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    try {
        const { firstName, lastName, email, role } = await request.json();

        // Validate user input
        const validation = validateUserInput({ firstName, lastName, email, role });
        if (!validation.valid) {
            return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
        }

        const client = await db.connect();

        // Check if user already exists
        const existingUser = await client.query('SELECT * FROM reg_users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            client.release();
            return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
        }

        const result = await client.query(
            'INSERT INTO reg_users (firstName, lastName, email, role) VALUES ($1, $2, $3, $4) RETURNING regID, firstName, lastName, email, role',
            [firstName, lastName, email, role]
        );
        
        client.release();

        return NextResponse.json({
            success: true,
            message: 'User registered successfully. They can now complete their sign-up.',
            user: result.rows[0],
        }, { status: 201 });

    } catch (error) {
        console.error('User registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


export async function PUT(request: NextRequest) {
    try {
        const { firstName, lastName, email, role, password, confirmPassword } = await request.json();

        // We only allow updating the password for a user who hasn't set one yet.
        // This is part of the "complete sign-up" flow.

        const validation = validateUserInput({ firstName, lastName, email, password, role, validatePassword: true });
        if (!validation.valid) {
            return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
        }
        
        if (password !== confirmPassword) {
            return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
        }

        const client = await db.connect();
        
        // Find the user by email
        const userResult = await client.query('SELECT * FROM reg_users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            client.release();
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }
        
        const user = userResult.rows[0];

        // Check if password is already set
        if (user.password) {
            client.release();
            return NextResponse.json({ error: 'Account is already fully set up. Please use login or password reset.' }, { status: 409 });
        }
        
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user with the hashed password
        const updateResult = await client.query(
            'UPDATE reg_users SET password = $1 WHERE email = $2 RETURNING regID, firstName, lastName, email, role',
            [hashedPassword, email]
        );

        client.release();
        
        const updatedUser = updateResult.rows[0];

        // Sign a new token for immediate login
        const userPayload = {
            id: updatedUser.regid,
            firstName: updatedUser.firstname,
            lastName: updatedUser.lastname,
            email: updatedUser.email,
            role: updatedUser.role,
        };

        const token = jwt.sign(userPayload, process.env.JWT_SECRET!, {
            expiresIn: '2h',
        });

        const cookie = require('cookie').serialize('authToken', token, {
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
        console.error('Sign-up completion error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
    }

    try {
        const client = await db.connect();
        const result = await client.query('SELECT regid, firstname, lastname, email, role, password IS NOT NULL as has_password FROM reg_users WHERE email = $1', [email]);
        client.release();

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        const user = result.rows[0];
        const responseUser = {
            id: user.regid,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            password: user.has_password, // Will be true if password is set, false if null
        };

        return NextResponse.json(responseUser, { status: 200 });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}