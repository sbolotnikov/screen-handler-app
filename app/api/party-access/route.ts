import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/configs/authOptions';
import {
  addPartyAccessToUser,
  getUserAccessibleParties,
  hasPartyAccess,
} from '@/utils/partyAccess';
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  updateDoc,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/firebase';

interface SessionWithUser {
  user?: {
    email?: string | null;
    role?: string | null;
  };
}

// GET: Get user's accessible parties or check specific party access
export async function GET(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');
    const userEmail = searchParams.get('userEmail') || session.user.email;
    const getAllParties = searchParams.get('getAllParties') === 'true';

    if (getAllParties && session.user.role === 'Admin') {
      // Return all parties for admin interface
      const partiesSnapshot = await getDocs(collection(db, 'parties'));
      const allParties = partiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed Party',
        ...doc.data(),
      }));
      return NextResponse.json({ parties: allParties });
    }

    if (partyId) {
      // Check access to specific party
      const access = await hasPartyAccess(userEmail, partyId);
      return NextResponse.json({ hasAccess: access });
    } else {
      // Get all accessible parties
      const parties = await getUserAccessibleParties(userEmail);
      return NextResponse.json({ parties });
    }
  } catch (error) {
    console.error('Error in party access GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Grant party access to user (Admin only)
export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userEmail, partyId } = await req.json();

    if (!userEmail || !partyId) {
      return NextResponse.json(
        { error: 'Missing userEmail or partyId' },
        { status: 400 }
      );
    }

    const success = await addPartyAccessToUser(userEmail, partyId);

    if (success) {
      return NextResponse.json({
        message: 'Party access granted successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to grant party access' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in party access POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove party access from user (Admin only)
export async function DELETE(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userEmail, partyId } = await req.json();

    if (!userEmail || !partyId) {
      return NextResponse.json(
        { error: 'Missing userEmail or partyId' },
        { status: 400 }
      );
    }

    // Find user and remove party from their parties array
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', userEmail),
      limit(1)
    );
    const userSnapshot = await getDocs(usersQuery);

    if (userSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);

    await updateDoc(userRef, {
      parties: arrayRemove(partyId),
    });

    return NextResponse.json({ message: 'Party access removed successfully' });
  } catch (error) {
    console.error('Error in party access DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
