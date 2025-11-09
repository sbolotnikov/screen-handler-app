/**
 * Migration script to add parties field to existing users
 * This should be run once to migrate existing data
 */

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export async function migrateUsersAddPartiesField() {
  try {
    console.log('Starting user migration to add parties field...');

    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));

    // Get all party IDs
    const partiesSnapshot = await getDocs(collection(db, 'parties'));
    const allPartyIds = partiesSnapshot.docs.map((doc) => doc.id);

    console.log(
      `Found ${usersSnapshot.docs.length} users and ${allPartyIds.length} parties`
    );

    // Update each user to have all party access
    const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();

      // Skip if user already has parties field
      if (userData.parties && Array.isArray(userData.parties)) {
        console.log(`User ${userData.email} already has parties field`);
        return;
      }

      const userRef = doc(db, 'users', userDoc.id);
      await updateDoc(userRef, {
        parties: allPartyIds, // Give access to all existing parties
      });

      console.log(
        `Updated user ${userData.email} with ${allPartyIds.length} party access`
      );
    });

    await Promise.all(updatePromises);
    console.log('Migration completed successfully!');

    return {
      success: true,
      usersUpdated: usersSnapshot.docs.length,
      partiesGranted: allPartyIds.length,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function addPartiesToSpecificUser(
  userEmail: string,
  partyIds: string[]
) {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userDoc = usersSnapshot.docs.find(
      (doc) => doc.data().email === userEmail
    );

    if (!userDoc) {
      throw new Error(`User ${userEmail} not found`);
    }

    const userRef = doc(db, 'users', userDoc.id);
    const currentData = userDoc.data();
    const currentParties = currentData.parties || [];

    // Merge new party IDs with existing ones (no duplicates)
    const updatedParties = [...new Set([...currentParties, ...partyIds])];

    await updateDoc(userRef, {
      parties: updatedParties,
    });

    console.log(`Added ${partyIds.length} parties to user ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error adding parties to user:', error);
    throw error;
  }
}
