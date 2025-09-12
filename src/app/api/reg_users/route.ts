//this file seeds the reg_users table to provide credentials to login.
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db'; 
import { validateUserInput } from '@/lib/validator';

// CORS Headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// GET handler to fetch user by email
export async function GET(req: NextRequest) {
  const client = await db.connect();
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
    }

    const { rows } = await client.sql`
      SELECT regID, firstName, lastName, email, role FROM reg_users WHERE email = ${email};
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers });
    }

    return NextResponse.json(rows[0], { status: 200, headers });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching user', details: (error as Error).message },
      { status: 500, headers }
    );
  } finally {
    client.release();
  }
}


// POST handler → add user (password stays NULL)
export async function POST(req: Request) {
    const client = await db.connect();
    try {
      const body = await req.json();
      let { firstName, lastName, email, role } = body;
      
      // Capitalize the first letter of the role
      if (role && typeof role === 'string') {
        role = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
      }

      // Validate user input
      const validation = validateUserInput({ firstName, lastName, email, role });
      if (!validation.valid) {
        return NextResponse.json({ errors: validation.errors }, { status: 400 });
      }
  
      // Ensure table exists
      await client.sql`
        CREATE TABLE IF NOT EXISTS reg_users (
          regID UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          firstName VARCHAR(255) NOT NULL,
          lastName VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          role VARCHAR(50) NOT NULL,
          password VARCHAR(255)
        );
      `;

      // Check for existing email
      const existingUser = await client.sql`SELECT * FROM reg_users WHERE email = ${email};`;
      if (existingUser.rowCount > 0) {
        return NextResponse.json(
          { error: 'Email already exists. Please use a different email.' },
          { status: 409, headers }
        );
      }
  
      // Insert user (password remains NULL)
      await client.sql`
        INSERT INTO reg_users (firstName, lastName, email, role)
        VALUES (${firstName}, ${lastName}, ${email}, ${role});
      `;
  
      return NextResponse.json(
        { message: 'User created successfully with null password' },
        { status: 201, headers }
      );
    } catch (error) {
      // Handle potential race condition on unique constraint
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        return NextResponse.json(
            { error: 'Email already exists. Please use a different email.' },
            { status: 409, headers }
          );
      }
      return NextResponse.json(
        { error: 'Error creating user', details: (error as Error).message },
        { status: 500, headers }
      );
    } finally {
      client.release();
    }
  }

// PUT handler → update password
export async function PUT(req: Request) {
    const client = await db.connect();
    try {
        const body = await req.json();
        let { firstName, lastName, email, role, password } = body;

        // Capitalize the first letter of the role
        if (role && typeof role === 'string') {
            role = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        }

        const validation = validateUserInput({ firstName, lastName, email, role, password, validatePassword: true });
        if (!validation.valid) {
            return NextResponse.json({ errors: validation.errors }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await client.sql`
        UPDATE reg_users
        SET password = ${hashedPassword}
        WHERE email = ${email}
        RETURNING regID, email;
        `;

        if (result.rowCount === 0) {
        return NextResponse.json(
            { error: 'User not found' },
            { status: 404, headers }
        );
        }

        return NextResponse.json(
        { message: 'Password updated successfully' },
        { status: 200, headers }
        );
    } catch (error) {
        return NextResponse.json(
        { error: 'Error updating password', details: (error as Error).message },
        { status: 500, headers }
        );
    } finally {
        client.release();
    }
}
