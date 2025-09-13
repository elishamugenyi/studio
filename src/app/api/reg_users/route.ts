
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

    const existingUser = await db.query('SELECT * FROM reg_users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
    }

    const client = await db.connect();
    try {
      await client.query(
        'INSERT INTO reg_users (firstName, lastName, email, role) VALUES ($1, $2, $3, $4)',
        [firstName, lastName, email, role]
      );
      return NextResponse.json({ message: 'User registered for sign-up.' }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const userResult = await db.query('SELECT * FROM reg_users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    
    const user = userResult.rows[0];

    // Check if password already exists
    if (user.password) {
        return NextResponse.json({ error: 'You are already set up. Please log in.' }, { status: 409 });
    }

    const validation = validateUserInput({
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      role: user.role,
      password: password,
      validatePassword: true,
    });

    if (!validation.valid) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await db.connect();
    try {
      await client.query('UPDATE reg_users SET password = $1 WHERE email = $2', [hashedPassword, email]);
      return NextResponse.json({ message: 'Sign-up complete. Password set.' }, { status: 200 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get('email');
  
    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
    }
  
    try {
      const { rows } = await db.query('SELECT firstname, lastname, email, role, password FROM reg_users WHERE email = $1', [email]);
  
      if (rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
  
      // Return user data, including a check for whether a password is set
      const user = rows[0];
      return NextResponse.json({
        ...user,
        password: !!user.password // Return true if password exists, false otherwise
      }, { status: 200 });
  
    } catch (error) {
      console.error('GET Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
