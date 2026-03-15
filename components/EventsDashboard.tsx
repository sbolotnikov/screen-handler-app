'use client';

import {  useState } from 'react';
import { useSession } from 'next-auth/react';

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Icon } from '@/components/Icon';
import SettingsDashboard from './SettingDashboard';
import { Team, Dance, Judge, ScoreValue } from '@/types/types';
import ScoringPage from './ScoringModal';
import DisplayCompResults from './DisplayCompResults';
import usePartySettings from '@/hooks/usePartySettings';

/**
 * Dashboard Page
 * Displays a list of all events (parties) and allows creating or deleting them.
 */
export default function EventsDashboard({ id }: { id?: string }) {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const [snapshot, loading, error] = useCollection(
    collection(doc(collection(db, 'parties'), id), 'events'),
  );
  const {events} = usePartySettings();
  console.log('Events from usePartySettings:', events);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [eventID, setEventID] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Derive teams, dances, and judges directly from snapshot and eventID
  const selectedEvent = snapshot?.docs.find((doc) => doc.id === eventID);
  const teams: Team[] = selectedEvent?.data().teams || [];
  const dances: Dance[] = selectedEvent?.data().dances || [];
  const judges: Judge[] = selectedEvent?.data().judges || [];
  const eventName: string = selectedEvent?.data().name || '';
  const scores: Record<string, Record<string, Record<string, ScoreValue | null>>> = selectedEvent?.data().scores || {};
  /**
   * Handles the creation of a new event document in Firestore.
   */
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim() || !id || id === '00') return;
    try {
      // Use the sub-collection 'events' inside the current party
      await addDoc(collection(doc(collection(db, 'parties'), id), 'events'), {
        name: newEventName.trim(),
        createdAt: Date.now(),
        teams: [],
        dances: [],
        judges: [],
        scores: {},
      });
      setIsCreateModalOpen(false);
      setNewEventName('');
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  /**
   * Confirms and executes the deletion of an event document.
   */
  const confirmDelete = async () => {
    if (!eventToDelete || !id || id === '00') return;
    try {
      await deleteDoc(doc(db, 'parties', id, 'events', eventToDelete));
      setEventToDelete(null);
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  if (!id || id === '00')
    return (
      <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-200">
        <h3 className="text-xl font-bold text-stone-900">
          Please choose a party first
        </h3>
      </div>
    );

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
      </div>
    );

  if (error) return <div>Error loading events: {error.message}</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">
            My Events
          </h1>
          <p className="mt-2 text-stone-500 text-lg">
            Manage your dance competitions
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-md hover:shadow-lg transition-all"
        >
          <Icon name="Plus" className="mr-2 h-5 w-5" /> New Event
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {snapshot?.docs.map((document) => {
          const data = document.data();
          return (
            <div
              key={document.id}
              onClick={(e) => {
                e.preventDefault();
                setEventID(document.id);
              }}
              className="block bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative group border border-stone-200/60 hover:border-violet-200 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-violet-50 rounded-2xl group-hover:bg-violet-100 transition-colors">
                    <Icon name="Calendar" className="h-7 w-7 text-violet-600" />
                  </div>
                  <h2 className="text-xl font-bold text-stone-900 truncate pr-8">
                    {data.name || 'Unnamed Event'}
                  </h2>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEventToDelete(document.id);
                  }}
                  className="absolute top-6 right-6 p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Event"
                >
                  <Icon name="Trash2" className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-stone-100 pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-stone-900">
                    {data.teams?.length || 0}
                  </p>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mt-1">
                    Teams
                  </p>
                </div>
                <div className="text-center border-l border-r border-stone-100">
                  <p className="text-2xl font-bold text-stone-900">
                    {data.dances?.length || 0}
                  </p>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mt-1">
                    Dances
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-stone-900">
                    {data.judges?.length || 0}
                  </p>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mt-1">
                    Judges
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center text-violet-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Manage Event{' '}
                <Icon name="ChevronRight" className="ml-1 h-4 w-4" />
              </div>
            </div>
          );
        })}

        {snapshot?.docs.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-200">
            <div className="mx-auto w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
              <Icon name="Calendar" className="h-10 w-10 text-stone-400" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">
              No events found
            </h3>
            <p className="mt-2 text-stone-500 max-w-sm mx-auto">
              Create your first dance competition event to start adding teams,
              dances, and judges.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-6 inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full text-violet-700 bg-violet-100 hover:bg-violet-200 transition-colors"
            >
              <Icon name="Plus" className="mr-2 h-5 w-5" /> Create Event
            </button>
          </div>
        )}




      </div>
{eventID && user?.role === 'Admin' && (
          <div className="mt-8 w-full">
            <SettingsDashboard partyID={id} id={eventID} name={eventName} teams={teams} dances={dances} judges={judges} />
            <DisplayCompResults  scores={scores} teams={teams} dances={dances} judges={judges} />
          </div>
        )}
        {eventID && user?.role === 'Judge' && (
          <div className="mt-8 w-full">
            <ScoringPage partyID={id} id={eventID} scores={scores} teams={teams} dances={dances} judges={judges.filter(judge => judge.id === user.id)} />
            
          </div>
        )}
      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-stone-900">
                Create New Event
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 p-2 rounded-full transition-colors"
              >
                <Icon name="X" className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="mb-6">
                <label
                  htmlFor="eventName"
                  className="block text-sm font-semibold text-stone-700 mb-2"
                >
                  Event Name
                </label>
                <input
                  type="text"
                  id="eventName"
                  autoFocus
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full rounded-xl border-stone-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-lg p-3 border transition-colors"
                  placeholder="e.g., Spring Dance Competition"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 border border-stone-200 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 transition-colors"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Icon name="Trash2" className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-3">
              Delete Event
            </h3>
            <p className="text-stone-500 mb-8 text-lg leading-relaxed">
              Are you sure you want to delete this event? All data, including
              teams, dances, and scores, will be permanently lost.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEventToDelete(null)}
                className="px-5 py-2.5 border border-stone-200 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
