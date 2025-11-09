import { db } from '@/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

type UserUpdateData = {
  name?: string;
  image?: string | null;
  telephone?: string;
  email?: string;
  emailVerified?: string;
  password?: string;
  updatedAt?: string;
};

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
    const { name, id, image, email, phone, password } = data;

    console.log('Profile update request:', {
      name,
      id,
      image,
      email,
      phone,
      hasPassword: !!password,
    });

    // Validate required fields
    if (!id) {
      return new NextResponse(
        JSON.stringify({
          message: 'User ID is required',
          status: 400,
        }),
        { status: 400 }
      );
    }

    // Check if user exists by document ID
    const userDocRef = doc(db, 'users', id);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return new NextResponse(
        JSON.stringify({
          message: 'No such user exists',
          status: 422,
        }),
        { status: 422 }
      );
    }

    const currentUserData = userDoc.data();
    console.log('Current user data:', currentUserData);

    // Check if email is being changed and if it's already taken by another user
    if (email && email !== currentUserData.email) {
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '==', email),
        limit(1)
      );
      const emailQuerySnapshot = await getDocs(emailQuery);

      if (!emailQuerySnapshot.empty) {
        const existingUserDoc = emailQuerySnapshot.docs[0];
        // If the email belongs to a different user, return error
        if (existingUserDoc.id !== id) {
          return new NextResponse(
            JSON.stringify({
              message: 'Email is already taken by another user',
              status: 422,
            }),
            { status: 422 }
          );
        }
      }
    }

    // Build update object with only changed fields
    const updateObj: UserUpdateData = {};

    if (name && currentUserData.name !== name) {
      updateObj.name = name;
    }

    if (image !== undefined && currentUserData.image !== image) {
      updateObj.image = image;
    }

    if (phone !== undefined && currentUserData.telephone !== phone) {
      updateObj.telephone = phone;
    }

    if (email && currentUserData.email !== email) {
      updateObj.email = email;
      // Reset email verification when email changes
      const timestamp = Date.now();
      const dateObject = new Date(timestamp);
      const date = dateObject.getDate();
      const month = dateObject.getMonth() + 1;
      const year = dateObject.getFullYear();
      const hour = dateObject.getHours();
      const minute = dateObject.getMinutes();
      const second = dateObject.getSeconds();
      updateObj.emailVerified = `${year}-${month}-${date} ${hour}:${minute}:${second}`;
    }

    // Handle password update
    if (password && password.length > 0) {
      const salt = parseInt(process.env.BCRYPT_SALT || '12', 10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateObj.password = hashedPassword;
    }

    // Add update timestamp
    updateObj.updatedAt = new Date().toISOString();

    console.log('Update object:', updateObj);

    // Only update if there are changes
    if (Object.keys(updateObj).length > 0) {
      await updateDoc(userDocRef, updateObj);
      console.log('User updated successfully');
    } else {
      console.log('No changes detected, skipping update');
    }

    // Send success response
    return new NextResponse(
      JSON.stringify({
        message: 'Profile updated successfully',
        status: 200,
        updated: Object.keys(updateObj),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return new NextResponse(
      JSON.stringify({
        message: 'Internal server error',
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}
