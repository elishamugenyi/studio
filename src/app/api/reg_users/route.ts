// src/app/api/reg_users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';

// Capitalize first letter of a string
function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// GET user by email
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email query parameter is required.' }, { status: 400 });
    }

    try {
        const result = await db.query('SELECT firstname, lastname, email, role, password FROM registered_users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }
        
        const user = result.rows[0];
        
        // Don't expose the hashed password
        const { password, ...userWithoutPassword } = user;

        return NextResponse.json({ ...userWithoutPassword, hasPassword: !!password }, { status: 200 });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


// POST to create a new user (for admins)
export async function POST(request: NextRequest) {
    const { firstName, lastName, email, role } = await request.json();

    const capitalizedFirstName = capitalize(firstName);
    const capitalizedLastName = capitalize(lastName);
    const capitalizedRole = capitalize(role);

    try {
        // Check for duplicate email
        const existingUser = await db.query('SELECT * FROM registered_users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return NextResponse.json({ error: 'Email already registered.' }, { status: 409 }); // 409 Conflict
        }
        
        const result = await db.query(
            'INSERT INTO registered_users (firstname, lastname, email, role) VALUES ($1, $2, $3, $4) RETURNING id, firstname, lastname, email, role',
            [capitalizedFirstName, capitalizedLastName, email, capitalizedRole]
        );
        
        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT to update user password (for user sign-up completion)
export async function PUT(request: NextRequest) {
    const { email, password, confirmPassword } = await request.json();

    if (password !== confirmPassword) {
        return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    try {
        // First, check if the user exists and if they already have a password
        const existingUserResult = await db.query('SELECT password FROM registered_users WHERE email = $1', [email]);

        if (existingUserResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }
        
        const existingUser = existingUserResult.rows[0];
        if (existingUser.password) {
            return NextResponse.json({ error: 'You are already set up. Please log in.' }, { status: 409 }); // 409 Conflict
        }

        const hashedPassword = await hash(password, 10);
        const result = await db.query(
            'UPDATE registered_users SET password = $1 WHERE email = $2 RETURNING id, firstname, lastname, email, role',
            [hashedPassword, email]
        );

        return NextResponse.json({ message: 'Password updated successfully.', user: result.rows[0] }, { status: 200 });

    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
