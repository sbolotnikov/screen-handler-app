import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/firebase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email),
      limit(1)
    );
    const userSnapshot = await getDocs(usersQuery);

    if (userSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
