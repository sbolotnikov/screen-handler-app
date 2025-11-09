import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '@/firebase';

export interface UserPartyAccess {
  id: string;
  email: string;
  name: string;
  role: string;
  parties: string[];
}

export interface PartyWithAccess {
  id: string;
  name: string;
  [key: string]: unknown; // Other party properties
}

/**
 * Get parties that a user has access to based on their role and parties array
 * @param userEmail - The email of the current user
 * @returns Array of parties the user can access
 */
export async function getUserAccessibleParties(
  userEmail: string
): Promise<PartyWithAccess[]> {
  try {
    // Get user data first
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', userEmail),
      limit(1)
    );
    const userSnapshot = await getDocs(usersQuery);

    if (userSnapshot.empty) {
      console.log('User not found:', userEmail);
      return [];
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userRole = userData.role || 'User';
    const userParties = userData.parties || [];

    // Get all parties from database
    const partiesSnapshot = await getDocs(collection(db, 'parties'));
    const allParties = partiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartyWithAccess[];

    // If user is Admin, return all parties
    if (userRole === 'Admin') {
      return allParties.sort((a, b) => a.name.localeCompare(b.name));
    }

    // For regular users, filter by parties array
    const accessibleParties = allParties.filter((party) =>
      userParties.includes(party.id)
    );

    return accessibleParties.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error getting accessible parties:', error);
    return [];
  }
}

/**
 * Add party access to a user
 * @param userEmail - The email of the user
 * @param partyId - The ID of the party to grant access to
 */
export async function addPartyAccessToUser(
  userEmail: string,
  partyId: string
): Promise<boolean> {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', userEmail),
      limit(1)
    );
    const userSnapshot = await getDocs(usersQuery);

    if (userSnapshot.empty) {
      console.log('User not found:', userEmail);
      return false;
    }

    const userDoc = userSnapshot.docs[0];
    const userRef = doc(db, 'users', userDoc.id);

    await updateDoc(userRef, {
      parties: arrayUnion(partyId),
    });

    console.log(`Added party ${partyId} access to user ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error adding party access:', error);
    return false;
  }
}

/**
 * Add party access to all existing users when a new party is created
 * @param partyId - The ID of the newly created party
 */
export async function addPartyAccessToAllUsers(partyId: string): Promise<void> {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));

    const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
      const userRef = doc(db, 'users', userDoc.id);
      await updateDoc(userRef, {
        parties: arrayUnion(partyId),
      });
    });

    await Promise.all(updatePromises);
    console.log(`Added party ${partyId} access to all users`);
  } catch (error) {
    console.error('Error adding party access to all users:', error);
  }
}

/**
 * Check if a user has access to a specific party
 * @param userEmail - The email of the user
 * @param partyId - The ID of the party to check
 * @returns Boolean indicating if user has access
 */
export async function hasPartyAccess(
  userEmail: string,
  partyId: string
): Promise<boolean> {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', userEmail),
      limit(1)
    );
    const userSnapshot = await getDocs(usersQuery);

    if (userSnapshot.empty) {
      return false;
    }

    const userData = userSnapshot.docs[0].data();
    const userRole = userData.role || 'User';
    const userParties = userData.parties || [];

    // Admins have access to all parties
    if (userRole === 'Admin') {
      return true;
    }

    // Regular users need party in their parties array
    return userParties.includes(partyId);
  } catch (error) {
    console.error('Error checking party access:', error);
    return false;
  }
}
