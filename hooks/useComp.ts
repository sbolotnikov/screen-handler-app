"use client"
import { createContext, useState, useEffect } from 'react';
import {  doc  } from 'firebase/firestore';
import { db2 } from '@/firebase';
import { useDocument } from 'react-firebase-hooks/firestore';
 
interface CompContextType {
 heat:string;
}
interface ReturnCompContextType {
    heat:string; 

} 
export const CompContext = createContext<ReturnCompContextType >({} as ReturnCompContextType );

export default function useComp(comp:string): ReturnCompContextType {  
    const [heat, setHeat] = useState({heat:''} as CompContextType);
 
 
  const [value2, loading1, err] = useDocument(
    doc(db2, 'competitions', comp),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  
  useEffect(() => {
    if (value2) { 
      console.log("got value",value2.data()?.currentHeat    ); 
      setHeat( {  heat:value2.data()?.currentHeat} as CompContextType);
    }
    if (err) console.log('error', err);
  }, [value2, err]);
 

 
  return {...heat};
}
  
