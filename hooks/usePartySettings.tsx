'use client';
import { createContext, useState, useContext, ReactNode } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase';
import { useDocument } from 'react-firebase-hooks/firestore';
import { EventData } from '@/types/types';

interface PartyContextType {
  image: string;
  name: string;
  message: string;
  message2: string;
  fontSize2: number;
  mode: string;
  fontName: string;
  fontSize: number;
  fontSizeTime: number;
  frameStyle: string;
  displayedPictures: { link: string; name: string; dances: string[] }[];
  displayedVideos: {
    name: string;
    image: string;
    link: string;
    dances: string[];
  }[];
  videoChoice: { link: string; name: string };
  compLogo: { link: string; name: string };
  titleBarHider: boolean;
  showUrgentMessage: boolean;
  showTable: boolean;
  tablePages: {
    name: string;
    tableRows: string[];
    rowsPictures: string[] | undefined;
    rowsChecked: boolean[];
  }[];
  tableChoice: number;
  showHeatNumber: boolean;
  heatNum: string;
  showSVGAnimation: boolean;
  showBackdrop: boolean;
  unmuteVideos: boolean;
  displayedPicturesAuto: { link: string; name: string }[];
  seconds: number;
  manualPicture: { link: string; name: string };
  savedMessages: string[];
  textColor: string;
  colorBG: string;
  id: string;
  animationSpeed: number;
  speedVariation: number;
  particleCount: number;
  maxSize: number;
  animationOption: number;
  rainAngle: number;
  originX: number;
  originY: number;
  compChoice: string;
  particleTypes: string[];
  events: EventData[];
  eventID: string;
  selectedDanceId?: string;
  selectedDanceIdJudge?: string;
}

interface ReturnPartyContextType extends PartyContextType {
  setCompID: (id: string) => void;
  addEvent: (event: Omit<EventData, 'id'>) => Promise<void>;
  updateEvent: (eventId: string, event: Partial<EventData>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  updateEventField: <K extends keyof EventData>(eventId: string, field: K, value: EventData[K]) => Promise<void>;
}

const PartyContext = createContext<ReturnPartyContextType | undefined>(undefined);

export function PartyProvider({ children }: { children: ReactNode }) {
  const [compID, setCompID] = useState('00');
  
  const partyArray: PartyContextType = {
    image: '',
    name: '',
    message: '',
    message2: '',
    fontSize2: 5,
    mode: '',
    fontName: '',
    fontSize: 10,
    fontSizeTime: 10,
    frameStyle: 'No frame',
    displayedPictures: [],
    displayedVideos: [],
    videoChoice: { link: '', name: '' },
    compLogo: { link: '', name: '' },
    titleBarHider: false,
    showUrgentMessage: false,
    showTable: false,
    unmuteVideos: false,
    tablePages: [
      {
        name: '',
        tableRows: [''],
        rowsPictures: undefined,
        rowsChecked: [false],
      },
    ],
    tableChoice: 0,
    showHeatNumber: false,
    heatNum: '',
    showSVGAnimation: false,
    showBackdrop: false,
    displayedPicturesAuto: [],
    seconds: 0,
    manualPicture: { link: '', name: '' },
    savedMessages: [''],
    textColor: '',
    colorBG: '',
    id: '',
    animationSpeed: 0,
    speedVariation: 0,
    particleCount: 0,
    maxSize: 0,
    animationOption: 0,
    rainAngle: 0,
    originX: 0,
    originY: 0,
    compChoice: '112',
    events: [],
    eventID: '',
    particleTypes: [
      'star', 'kiss', 'snowflake', 'heart', 'tower', 'LP', 'maple', 'rose', 'diamond', 'clover', 'streamer', 'lightning', 'hydrangea', 'fred',
    ],
  };

  const [value, loading, error] = useDocument(doc(db, 'parties', compID), {
    snapshotListenOptions: { includeMetadataChanges: true },
  });
 
  const party = value
    ? ({ events: [], ...value.data(), id: compID } as unknown as PartyContextType)
    : partyArray;

  const apiCall = async (body: any) => {
    const response = await fetch('/api/parties/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partyId: compID, ...body }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to perform event action');
    }

    return response.json();
  };

  const addEvent = async (event: Omit<EventData, 'id'>) => {
    if (!compID || compID === '00') return;
    await apiCall({ action: 'add-event', event });
  };

  const deleteEvent = async (eventId: string) => {
    if (!compID || compID === '00') return;
    await apiCall({ action: 'delete-event', eventId });
  };

  const updateEvent = async (eventId: string, updatedEvent: Partial<EventData>) => {
    if (!compID || compID === '00') return;
    await apiCall({ action: 'update-event', eventId, event: updatedEvent });
  };

  const updateEventField = async <K extends keyof EventData>(
    eventId: string,
    field: K,
    value: EventData[K],
  ) => {
    if (!compID || compID === '00') return;
    await apiCall({ action: 'update-event-field', eventId, field, value });
  };

  if (error) console.log('error', error);

  const contextValue: ReturnPartyContextType = {
    ...party,
    setCompID,
    addEvent,
    updateEvent,
    deleteEvent,
    updateEventField,
  };

  return <PartyContext.Provider value={contextValue}>{children}</PartyContext.Provider>;
}

export default function usePartySettings() {
  const context = useContext(PartyContext);
  if (context === undefined) {
    throw new Error('usePartySettings must be used within a PartyProvider');
  }
  return context;
}
