import { useEffect, useState, useCallback } from 'react';
import {
  addDoc,
  collection,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { save_Template } from '@/functions/functions';
import {
  getUserAccessibleParties,
  addPartyAccessToAllUsers,
  PartyWithAccess,
} from '@/utils/partyAccess';
import { useSession } from 'next-auth/react';
type Props = {
  onReturn: (str: string) => void;
  onAlert: (name: string, id: string) => void;
};
type PartyType = {
  image: string;
  name: string;
  message: string;
  mode: string;
  fontSize: number;
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
  showSVGAnimation: boolean;
  displayedPicturesAuto: { link: string; name: string }[];
  seconds: number;
  manualPicture: { link: string; name: string };
  savedMessages: string[];
  textColor: string;
  id: string;
  animationSpeed: number;
  speedVariation: number;
  particleCount: number;
  maxSize: number;
  animationOption: number;
  rainAngle: number;
  originX: number;
  originY: number;
  particleTypes: string[];
};
const ChoosePartyModal = ({ onReturn, onAlert }: Props) => {
  const { data: session } = useSession();
  const [parties, setParties] = useState<PartyType[]>([]);
  const [choosenParty, setChoosenParty] = useState<string>('');
  const [visibleInput, setVisibleInput] = useState(false);
  const [partyName, setPartyName] = useState<string>('');

  const getPartyArray = useCallback(async () => {
    if (!session?.user?.email) {
      console.log('No user session found');
      return;
    }

    try {
      // Use the new party access function
      const accessibleParties = await getUserAccessibleParties(
        session.user.email
      );

      const formattedParties = accessibleParties.map((party) => ({
        ...party,
        // Ensure all required PartyType fields are present with defaults
        image: (party.image as string) || '',
        name: (party.name as string) || '',
        message: (party.message as string) || '',
        mode: (party.mode as string) || 'Default',
        fontSize: (party.fontSize as number) || 10,
        displayedPictures:
          (party.displayedPictures as {
            link: string;
            name: string;
            dances: string[];
          }[]) || [],
        displayedVideos:
          (party.displayedVideos as {
            name: string;
            image: string;
            link: string;
            dances: string[];
          }[]) || [],
        videoChoice: (party.videoChoice as { link: string; name: string }) || {
          link: '',
          name: '',
        },
        compLogo: (party.compLogo as { link: string; name: string }) || {
          link: '',
          name: '',
        },
        titleBarHider: (party.titleBarHider as boolean) || false,
        showUrgentMessage: (party.showUrgentMessage as boolean) || false,
        showSVGAnimation: (party.showSVGAnimation as boolean) || false,
        displayedPicturesAuto:
          (party.displayedPicturesAuto as { link: string; name: string }[]) ||
          [],
        seconds: (party.seconds as number) || 5,
        manualPicture: (party.manualPicture as {
          link: string;
          name: string;
        }) || { link: '', name: '' },
        savedMessages: (party.savedMessages as string[]) || [],
        textColor: (party.textColor as string) || '#000000',
        animationSpeed: (party.animationSpeed as number) || 3,
        speedVariation: (party.speedVariation as number) || 0.4,
        particleCount: (party.particleCount as number) || 100,
        maxSize: (party.maxSize as number) || 20,
        animationOption: (party.animationOption as number) || 0,
        rainAngle: (party.rainAngle as number) || 0,
        originX: (party.originX as number) || 400,
        originY: (party.originY as number) || 400,
        particleTypes: (party.particleTypes as string[]) || [],
      })) as PartyType[];

      if (formattedParties.length > 0) {
        setChoosenParty(formattedParties[0].id);
      }
      setParties(formattedParties);
    } catch (error) {
      console.error('Error loading accessible parties:', error);
      // Fallback to old method if needed
      await getPartyArrayFallback();
    }
  }, [session?.user?.email]);

  // Fallback method (original implementation)
  async function getPartyArrayFallback() {
    const q = await getDocs(collection(db, 'parties'));
    interface FirestoreDocData {
      image: string;
      name: string;
      message: string;
      mode: string;
      fontSize: number;
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
      showSVGAnimation: boolean;
      displayedPicturesAuto: { link: string; name: string }[];
      seconds: number;
      manualPicture: { link: string; name: string };
      savedMessages: string[];
      textColor: string;
      animationSpeed: number;
      speedVariation: number;
      particleCount: number;
      maxSize: number;
      animationOption: number;
      rainAngle: number;
      originX: number;
      originY: number;
      particleTypes: string[];
    }

    const arr1 = q.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) =>
        doc.data() as FirestoreDocData
    );
    const arr2 = q.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => doc.id
    );
    interface PartyWithId extends FirestoreDocData {
      id: string;
    }

    const arr = arr1.map(
      (x: FirestoreDocData, i: number): PartyWithId => ({ ...x, id: arr2[i] })
    ) as PartyType[];
    arr.sort((a, b) => a.name.localeCompare(b.name));

    if (arr.length > 0) {
      setChoosenParty(arr[0].id);
    }
    setParties(arr);
  }

  useEffect(() => {
    if (session?.user?.email) {
      getPartyArray();
    }
  }, [session?.user?.email, getPartyArray]); // Include getPartyArray dependency

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const file1 = e.currentTarget.files![0];

    const reader = new FileReader();
    reader.onload = (function () {
      return async function () {
        const res = this.result?.toString();
        const resObj = JSON.parse(res !== undefined ? res : '');
        delete resObj.id;

        try {
          const partyRef = collection(db, 'parties');
          const docRef = await addDoc(partyRef, resObj);

          // Grant access to all users for the loaded party
          await addPartyAccessToAllUsers(docRef.id);

          console.log('Party loaded and access granted to all users');
          location.reload();
        } catch (error) {
          console.error('Error loading party:', error);
        }
      };
    })();
    reader.readAsText(file1);
  };

  return (
    <div className="w-full flex flex-col justify-center items-center">
      <select
        className="w-1/2 p-2"
        name="parties"
        id="parties"
        onChange={(e) => {
          setChoosenParty(e.target.value);
        }}
      >
        {parties.map((party, index) => {
          return (
            <option
              key={index}
              value={party.id}
              className="text-lightMainColor bg-lightMainBG dark:text-darkMainColor dark:bg-darkMainBG"
            >
              {party.name}
            </option>
          );
        })}
      </select>
      {choosenParty && choosenParty.length > 0 && (
        <div className="w-full flex flex-row flex-wrap justify-center items-center">
          <button
            className="btnFancy"
            onClick={() => {
              onReturn(choosenParty);
            }}
          >
            Use
          </button>
          <button
            className="btnFancy"
            onClick={() => {
              save_Template(
                JSON.stringify(
                  parties.filter((party) => party.id == choosenParty)[0]
                ),
                'party_' + choosenParty
              );
            }}
          >
            Save
          </button>

          <button
            className="btnFancy"
            onClick={() => {
              onAlert(
                parties.filter((party) => party.id == choosenParty)[0].name,
                choosenParty
              );
            }}
          >
            Delete
          </button>
        </div>
      )}
      <div className="w-full flex flex-row flex-wrap justify-center items-center">
        <button
          className="btnFancy"
          onClick={() => document.getElementById('inputField2')!.click()}
        >
          Load Party
        </button>
        <input
          type="file"
          id="inputField2"
          hidden
          accept="text/*"
          className="w-full mb-2 rounded-md text-gray-700"
          onChange={handleChange}
        />
        <button
          className="btnFancy"
          onClick={(e) => {
            e.preventDefault();
            setVisibleInput(!visibleInput);
          }}
        >
          Create Party
        </button>
        {visibleInput && (
          <div>
            <input
              type="text"
              value={partyName}
              className="w-full p-2 border border-gray-300 rounded"
              onChange={(e) => {
                e.preventDefault();
                setPartyName(e.target.value);
              }}
            />
            <button
              className="btnFancy"
              onClick={async (e) => {
                e.preventDefault();
                setVisibleInput(!visibleInput);
                console.log('submit');
                const resObj = {
                  image: '',
                  name: partyName,
                  message: '',
                  mode: 'Default',
                  fontSize: 10,
                  fontSizeTime: 10,
                  frameStyle: 'No frame',
                  displayedPictures: [],
                  displayedVideos: [],
                  videoChoice: { link: '', name: '' },
                  compLogo: { link: '', name: '' },
                  titleBarHider: false,
                  showUrgentMessage: false,
                  showHeatNumber: false,
                  showSVGAnimation: true,
                  displayedPicturesAuto: [],
                  seconds: 5,
                  manualPicture: { link: '', name: '' },
                  savedMessages: [
                    ' ',
                    'Argentine Tango',
                    'Bachata',
                    'Cha Cha',
                    'Foxtrot',
                    'Happy Birthday, Paul!',
                    'Hustle',
                    'Jive',
                    'Mambo',
                    'Merengue',
                    'POLKA',
                    'Paso Doble',
                    'Quickstep',
                    'Rumba',
                    'Salsa',
                    'Samba',
                    'Swing',
                    'Tango',
                    'Two Step',
                    'Viennese Waltz',
                    'Waltz',
                    'West Coast Swing',
                  ],
                  textColor: '#000000',
                  animationSpeed: 3,
                  speedVariation: 0.4,
                  particleCount: 100,
                  maxSize: 20,
                  animationOption: 0,
                  rainAngle: 0,
                  originX: 400,
                  originY: 400,
                  heat: '',
                  particleTypes: [],
                };

                try {
                  const partyRef = collection(db, 'parties');
                  const docRef = await addDoc(partyRef, resObj);

                  // Grant access to all users for the new party
                  await addPartyAccessToAllUsers(docRef.id);

                  console.log('Party created and access granted to all users');
                  location.reload();
                } catch (error) {
                  console.error('Error creating party:', error);
                }
              }}
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChoosePartyModal;
