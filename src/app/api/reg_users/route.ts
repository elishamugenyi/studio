
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { validateUserInput } from '@/lib/validator';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { firstName, lastName, email, role } = await request.json();

        const validation = validateUserInput({ firstName, lastName, email, role });

        if (!validation.valid) {
            return NextResponse.json({ errors: validation.errors }, { status: 400 });
        }

        const client = await db.connect();
        try {
            const checkUser = await client.query('SELECT * FROM reg_users WHERE email = $1', [email]);
            if (checkUser.rows.length > 0) {
                return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
            }

            const result = await client.query(
                'INSERT INTO reg_users (firstName, lastName, email, role) VALUES ($1, $2, $3, $4) RETURNING regID, firstName, lastName, email, role',
                [firstName, lastName, email, role]
            );

            return NextResponse.json({
                message: 'User created successfully. Please complete sign-up.',
                user: result.rows[0],
            }, { status: 201 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('User creation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


export async function PUT(request: NextRequest) {
    try {
        const { email, password, confirmPassword, firstName, lastName, role } = await request.json();

        if (password !== confirmPassword) {
            return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
        }

        const validation = validateUserInput({ firstName, lastName, email, role, password, validatePassword: true });
        if (!validation.valid) {
            return NextResponse.json({ errors: validation.errors }, { status: 400 });
        }

        const client = await db.connect();
        try {
            const checkUser = await client.query('SELECT * FROM reg_users WHERE email = $1', [email]);

            if (checkUser.rows.length === 0) {
                return NextResponse.json({ error: 'User not found. Cannot complete sign-up.' }, { status: 404 });
            }
            
            if (checkUser.rows[0].password) {
                 return NextResponse.json({ error: 'You are already set up.' }, { status: 400 });
            }


            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await client.query(
                'UPDATE reg_users SET password = $1 WHERE email = $2 RETURNING regID, firstName, lastName, email, role',
                [hashedPassword, email]
            );

            return NextResponse.json({ 
                message: 'Sign-up completed successfully.',
                user: result.rows[0]
            }, { status: 200 });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Sign-up completion error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
        return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
    }

    const client = await db.connect();
    try {
        const result = await client.query('SELECT regid, firstname, lastname, email, role, password FROM reg_users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        const user = result.rows[0];
        // Return a subset of data, indicating if the password is set
        const userResponse = {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            password: !!user.password // Convert password hash to boolean
        };

        return NextResponse.json(userResponse, { status: 200 });
    } catch (error) {
        console.error('GET user error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
