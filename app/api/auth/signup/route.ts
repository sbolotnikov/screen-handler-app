import { db } from '@/firebase';
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';

import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

// interface ExtendedNextApiRequest extends NextApiRequest {
//     body: {
//         email: string;
//         password: string;
//     };
//   }

export async function POST(req: Request) {
  try {
    // Only POST method is accepted
    if (req.method !== 'POST') {
      return new NextResponse(
        JSON.stringify({
          message: 'Only POST method is accepted',
          status: 405,
        }),
        { status: 405 }
      );
    }

    const data = await req.json();
    const { email, password } = data;

    // Validate input
    if (!email || !email.includes('@') || !password) {
      return new NextResponse(
        JSON.stringify({
          message: 'Invalid Data',
          status: 422,
        }),
        { status: 422 }
      );
    }

    // Check if user already exists
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email),
      limit(1)
    );
    const existingUsersSnapshot = await getDocs(usersQuery);

    // Send error response if duplicate user is found
    if (!existingUsersSnapshot.empty) {
      return new NextResponse(
        JSON.stringify({
          message: 'User already exists',
          status: 422,
        }),
        { status: 422 }
      );
    }

    // Hash password
    const salt = parseInt(process.env.BCRYPT_SALT || '12', 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create timestamp for email verification
    const timestamp = Date.now();
    const dateObject = new Date(timestamp);
    const date = dateObject.getDate();
    const month = dateObject.getMonth() + 1;
    const year = dateObject.getFullYear();
    const hour = dateObject.getHours();
    const minute = dateObject.getMinutes();
    const second = dateObject.getSeconds();

    // Create new user
    await addDoc(collection(db, 'users'), {
      email: email,
      password: hashedPassword,
      name: null,
      image: null,
      emailVerified: `${year}-${month}-${date} ${hour}:${minute}:${second}`,
      role: 'User',
      telephone: null,
      createdAt: new Date().toISOString(),
    });

    // Send success response
    return new NextResponse(
      JSON.stringify({
        message: 'User created successfully',
        status: 201,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new NextResponse(
      JSON.stringify({
        message: 'Internal server error',
        status: 500,
      }),
      { status: 500 }
    );
  }
}
