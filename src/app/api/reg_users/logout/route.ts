import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookie = serialize('authToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    expires: new Date(0), // Expire the cookie immediately
    path: '/',
  });

  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.headers.set('Set-Cookie', cookie);

  return response;
}
