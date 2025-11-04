"use client"
import { createContext, useState, useEffect } from 'react';
import {   doc,  } from 'firebase/firestore';
import { db } from '@/firebase'; 
import { useDocument } from 'react-firebase-hooks/firestore';
 
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
  displayedPictures: { link: string; name: string, dances:string[] }[];
  displayedVideos: {
    name: string;
    image: string;
    link: string;
    dances:string[];
  }[]; 
  videoChoice: { link: string; name: string };
  compLogo: { link: string; name: string };
  titleBarHider: boolean;
  showUrgentMessage: boolean;
  showTable:boolean;
  tablePages:{name:string, tableRows:string[],rowsPictures:string[] | undefined; rowsChecked:boolean[]}[];
  tableChoice:number;
  showHeatNumber: boolean;
  showSVGAnimation: boolean;
  showBackdrop: boolean;
  displayedPicturesAuto: { link: string; name: string }[];
  seconds: number;
  manualPicture: { link: string; name: string };
  savedMessages: string[];
  textColor: string;
  colorBG:string;
  id: string;
  animationSpeed: number;
  speedVariation: number;
    particleCount: number;
    maxSize: number;
    animationOption:number;
    rainAngle: number;
    originX: number;
    originY: number; 
    compChoice:string;
    particleTypes:string[];
}
interface ReturnPartyContextType {
  image: string;
  name: string;
  message: string;
  message2: string;
  fontSize2: number;
  mode: string;
  fontName:string;
  fontSize: number;
  fontSizeTime: number;
  frameStyle: string;
  displayedPictures: { link: string; name: string, dances:string[] }[];
  displayedVideos: {
    name: string;
    image: string;
    link: string;
    dances:string[];
  }[]; 
  videoChoice: { link: string; name: string };
  compLogo: { link: string; name: string };
  titleBarHider: boolean;
  showUrgentMessage: boolean;
  showTable: boolean;
  tablePages:{name:string, tableRows:string[],rowsPictures:string[] | undefined; rowsChecked:boolean[]}[]
  tableChoice:number;
  showHeatNumber: boolean;
  showBackdrop: boolean;
  showSVGAnimation: boolean;
  displayedPicturesAuto: { link: string; name: string }[];
  seconds: number;
  manualPicture: { link: string; name: string };
  savedMessages: string[];
  textColor: string;
  colorBG:string;
  animationSpeed: number;
  speedVariation: number;
  particleCount: number;
  maxSize: number;
  animationOption:number;
  rainAngle: number;
  id: string;
  originX: number;
  originY: number; 
  compChoice:string;
  particleTypes:string[];
  setCompID: (id: string) => void;

} 
export const PartyContext = createContext<ReturnPartyContextType >({} as ReturnPartyContextType );

export default function usePartySettings(): ReturnPartyContextType {
  const [compID, setCompID] = useState('00'); 
  const [partyArray, setPartyArray] = useState<PartyContextType>({
    image: '',
    name: '', 
    message: '',
    message2: '',
    fontSize2: 5,
    mode: '',
    fontName:'',
    fontSize:10,
    fontSizeTime:10,
    frameStyle:"No frame",
    displayedPictures:[],
    displayedVideos:[],
    videoChoice:{link:"",name:""}, 
    compLogo:{link:"",name:""},
    titleBarHider:false,
    showUrgentMessage:false,
    showTable:false,
    tablePages:[{name:"", tableRows:[""],rowsPictures: undefined, rowsChecked:[false]}],
    tableChoice:0,
    showHeatNumber:false,
    showSVGAnimation:false,
    showBackdrop:false,
    displayedPicturesAuto:[],  
    seconds:0, 
    manualPicture:{link:"",name:""},
    savedMessages:[""],
    textColor:"",
    colorBG:"",
    id:"",
    animationSpeed: 0,
    speedVariation: 0,
    particleCount: 0,
    maxSize: 0,
    animationOption:0,
    rainAngle: 0,
    originX: 0,
    originY: 0, 
    compChoice:"112",
    particleTypes:["star","kiss",'snowflake', 'heart', 'tower','LP',"maple",'rose','diamond','clover','streamer','lightning','hydrangea','fred'],
  });
  
    
 
  const [value, loading, error] = useDocument(
    doc(db, 'parties', compID),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );
 
   

  useEffect(() => {
    if (value) { 
      let party = {...value.data(), id:compID, } as PartyContextType;
      setPartyArray(party);
    }
    if (error) console.log('error', error);
  }, [value, compID, error]);
  
  
 

 
  return {...partyArray, setCompID};
}
  




 

 
 

  





// NEED TO ADD TO POSTGRESQL DB  QUERIES AT THE DATABASE:

// CREATE OR REPLACE FUNCTION notify_party_changes()
// RETURNS trigger AS $$
// DECLARE
//   data json;
//   notification json;
// BEGIN
//   -- Determine the operation type
//   IF (TG_OP = 'UPDATE') THEN
//     data = row_to_json(OLD);
//   ELSE
//     data = row_to_json(NEW);
//   END IF;

//   -- Construct the notification as a JSON string
//   notification = json_build_object(
//     'table', 'Party',
//     'action', 'UPDATE',
//     'data', data
//   );

//   -- Send the notification
//   PERFORM pg_notify('party_changes', notification::text);

//   RETURN NULL;
// END;
// $$ LANGUAGE plpgsql;

// -- Create a trigger that calls this function after INSERT, UPDATE, or DELETE on the party table
// CREATE TRIGGER party_changes_trigger
// AFTER INSERT OR UPDATE OR DELETE ON "Party"
// FOR EACH ROW EXECUTE FUNCTION notify_party_changes();