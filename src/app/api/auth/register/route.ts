import {NextRequest, NextResponse} from 'next/server';
// TODO: Uncomment when database is connected
// import bcrypt from 'bcryptjs';
// import { db } from '@/lib/db';
// import { users } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const {email, password, username} = await request.json();

    // Validation
    if (!email || !password || !username) {
      return NextResponse.json(
        {error: 'Email, password, and username are required'},
        {status: 400}
      );
    }

    if (username.includes(' ')) {
      return NextResponse.json(
        {error: 'Username cannot contain spaces'},
        {status: 400}
      );
    }

    if (username.length > 32) {
      return NextResponse.json(
        {error: 'Username must be less than 32 characters'},
        {status: 400}
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {error: 'Password must be at least 6 characters long'},
        {status: 400}
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {error: 'Please enter a valid email address'},
        {status: 400}
      );
    }

    // TODO: Check if user already exists when DB is connected
    // const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    // const existingUsername = await db.select().from(users).where(eq(users.username, username)).limit(1);

    // if (existingUser.length > 0) {
    //   return NextResponse.json(
    //     { error: 'User with this email already exists' },
    //     { status: 400 }
    //   );
    // }

    // if (existingUsername.length > 0) {
    //   return NextResponse.json(
    //     { error: 'Username is already taken' },
    //     { status: 400 }
    //   );
    // }

    // TODO: Hash password when database is connected
    // const saltRounds = 12;
    // const hashedPassword = await bcrypt.hash(password, saltRounds);

    // TODO: Create user in database when DB is connected
    // const newUser = await db.insert(users).values({
    //   email,
    //   username,
    //   password: hashedPassword,
    //   name: username, // Use username as display name initially
    // }).returning();

    // For now, return success without actually creating user
    return NextResponse.json(
      {
        message: 'Registration successful! Please sign in.',
        // TODO: Remove this note when DB is connected
        note: 'Note: User not actually created until database is connected'
      },
      {status: 201}
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {error: 'Internal server error'},
      {status: 500}
    );
  }
}
