import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/configs/authOptions';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

interface SessionWithUser {
  user?: {
    email?: string | null;
    role?: string | null;
  };
}

// GET: Get all users (Admin only)
export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin - we need to get user from database since session might not have role yet
    const userEmail = session.user.email;

    // Get user's role from database
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const currentUser = usersSnapshot.docs.find(
      (doc) => doc.data().email === userEmail
    );

    if (!currentUser || currentUser.data().role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all users
    const allUsers = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error('Error in users GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update user role, name, and image (Admin only)
export async function PUT(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userEmail = session.user.email;
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const currentUser = usersSnapshot.docs.find(
      (doc) => doc.data().email === userEmail
    );

    if (!currentUser || currentUser.data().role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, role, name, image } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const dataToUpdate: { role?: string; name?: string; image?: string } = {};
    if (role) dataToUpdate.role = role;
    if (name) dataToUpdate.name = name;
    if (image) dataToUpdate.image = image;


    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, dataToUpdate);

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error in users PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
