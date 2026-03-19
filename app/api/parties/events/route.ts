import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/configs/authOptions';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { hasPartyAccess } from '@/utils/partyAccess';
import { EventData } from '@/types/types';

interface SessionWithUser {
  user?: {
    email?: string | null;
    role?: string | null;
    parties?: string[];
  };
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partyId, eventId, field, value, action, event } = await req.json();

    if (!partyId) {
      return NextResponse.json(
        { error: 'Missing partyId' },
        { status: 400 }
      );
    }

    // Verify user has access to this party
    const userEmail = session.user.email;
    const userRole = session.user.role || 'User';
    
    // Admins can update anything, others need party access
    const hasAccess = await hasPartyAccess(userEmail, partyId);
    
    if (!hasAccess && userRole !== 'Admin') {
       return NextResponse.json(
        { error: 'You do not have access to this party' },
        { status: 403 }
      );
    }

    const partyRef = doc(db, 'parties', partyId);

    // Handle different actions
    if (action === 'add-event') {
      if (!event) return NextResponse.json({ error: 'Missing event data' }, { status: 400 });
      const newEvent = { ...event, id: crypto.randomUUID() };
      await updateDoc(partyRef, {
        events: arrayUnion(newEvent),
      });
      return NextResponse.json({ message: 'Event added successfully', eventId: newEvent.id });
    }

    if (action === 'delete-event') {
      if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
      
      const partySnap = await getDoc(partyRef);
      if (!partySnap.exists()) return NextResponse.json({ error: 'Party not found' }, { status: 404 });
      
      const partyData = partySnap.data();
      const events = (partyData.events || []) as EventData[];
      const eventToRemove = events.find((e) => e.id === eventId);
      
      if (eventToRemove) {
        await updateDoc(partyRef, {
          events: arrayRemove(eventToRemove),
        });
      }
      return NextResponse.json({ message: 'Event deleted successfully' });
    }

    if (action === 'update-event-field') {
      if (!eventId || !field) return NextResponse.json({ error: 'Missing eventId or field' }, { status: 400 });
      
      const partySnap = await getDoc(partyRef);
      if (!partySnap.exists()) return NextResponse.json({ error: 'Party not found' }, { status: 404 });
      
      const partyData = partySnap.data();
      const events = (partyData.events || []) as EventData[];
      
      const newEvents = events.map((e) =>
        e.id === eventId ? { ...e, [field]: value } : e
      );

      await updateDoc(partyRef, {
        events: newEvents,
      });
      return NextResponse.json({ message: 'Event field updated successfully' });
    }

    if (action === 'update-event') {
      if (!eventId || !event) return NextResponse.json({ error: 'Missing eventId or event data' }, { status: 400 });
      
      const partySnap = await getDoc(partyRef);
      if (!partySnap.exists()) return NextResponse.json({ error: 'Party not found' }, { status: 404 });
      
      const partyData = partySnap.data();
      const events = (partyData.events || []) as EventData[];
      
      const newEvents = events.map((e) =>
        e.id === eventId ? { ...e, ...event } : e
      );

      await updateDoc(partyRef, {
        events: newEvents,
      });
      return NextResponse.json({ message: 'Event updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in party events API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
