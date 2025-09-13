//this will drop table reg_users and create it again.
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const client = await db.connect();
}