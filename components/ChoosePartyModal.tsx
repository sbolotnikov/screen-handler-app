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
} from '@/utils/partyAccess';
import { useSession } from 'next-auth/react';
import { TablePage } from '@/types/types';

// Extend the session user type to include role
interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

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
  tablePages: TablePage[];
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
        tablePages: (party.tablePages as TablePage[]) || [],
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
      tablePages: TablePage[];
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
          <div className="w-full flex flex-col gap-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
            <input
              type="text"
              value={partyName}
              placeholder="Enter party name"
              className="w-full p-2 border border-gray-300 rounded"
              onChange={(e) => {
                e.preventDefault();
                setPartyName(e.target.value);
              }}
            />

            {/* Admin-only section copying options */}
            {(session?.user as ExtendedUser)?.role === 'Admin' &&
              parties.length > 0 && (
                <div className="w-full border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Copy sections from existing parties (Admin only):
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* displayedPictures */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Pictures:</label>
                      <select
                        data-section="displayedPictures"
                        className="flex-1 p-1 text-xs border border-gray-300 rounded"
                      >
                        <option value="">Copy from...</option>
                        {parties.map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} ({party.displayedPictures.length} pics)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* displayedVideos */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Videos:</label>
                      <select
                        data-section="displayedVideos"
                        className="flex-1 p-1 text-xs border border-gray-300 rounded"
                      >
                        <option value="">Copy from...</option>
                        {parties.map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} ({party.displayedVideos.length} videos)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* displayedPicturesAuto */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Auto Pictures:</label>
                      <select
                        data-section="displayedPicturesAuto"
                        className="flex-1 p-1 text-xs border border-gray-300 rounded"
                      >
                        <option value="">Copy from...</option>
                        {parties.map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} ({party.displayedPicturesAuto.length}{' '}
                            auto pics)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* savedMessages */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Messages:</label>
                      <select
                        data-section="savedMessages"
                        className="flex-1 p-1 text-xs border border-gray-300 rounded"
                      >
                        <option value="">Copy from...</option>
                        {parties.map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} ({party.savedMessages.length} messages)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* tablePages */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Table Pages:</label>
                      <select
                        data-section="tablePages"
                        className="flex-1 p-1 text-xs border border-gray-300 rounded"
                      >
                        <option value="">Copy from...</option>
                        {parties.map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} ({party.tablePages.length} tables)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

            <button
              className="btnFancy"
              onClick={async (e) => {
                e.preventDefault();
                setVisibleInput(!visibleInput);
                console.log('submit');

                // Get selected values from admin dropdowns
                const copiedData: Partial<PartyType> = {};

                if ((session?.user as ExtendedUser)?.role === 'Admin') {
                  const selects = document.querySelectorAll(
                    'select[data-section]'
                  ) as NodeListOf<HTMLSelectElement>;
                  selects.forEach((select) => {
                    const section = select.dataset.section;
                    const selectedPartyId = select.value;
                    if (selectedPartyId && section) {
                      const sourceParty = parties.find(
                        (p) => p.id === selectedPartyId
                      );
                      if (sourceParty) {
                        switch (section) {
                          case 'displayedPictures':
                            copiedData.displayedPictures =
                              sourceParty.displayedPictures;
                            break;
                          case 'displayedVideos':
                            copiedData.displayedVideos =
                              sourceParty.displayedVideos;
                            break;
                          case 'displayedPicturesAuto':
                            copiedData.displayedPicturesAuto =
                              sourceParty.displayedPicturesAuto;
                            break;
                          case 'savedMessages':
                            copiedData.savedMessages =
                              sourceParty.savedMessages;
                            break;
                          case 'tablePages':
                            copiedData.tablePages = sourceParty.tablePages;
                            break;
                        }
                      }
                    }
                  });
                }

                const resObj = {
                  image: '',
                  name: partyName,
                  message: '',
                  mode: 'Default',
                  fontSize: 10,
                  fontSizeTime: 10,
                  frameStyle: 'No frame',
                  displayedPictures: copiedData.displayedPictures || [],
                  displayedVideos: copiedData.displayedVideos || [],
                  videoChoice: { link: '', name: '' },
                  compLogo: { link: '', name: '' },
                  titleBarHider: false,
                  showUrgentMessage: false,
                  showHeatNumber: false,
                  showSVGAnimation: true,
                  displayedPicturesAuto: copiedData.displayedPicturesAuto || [],
                  seconds: 5,
                  manualPicture: { link: '', name: '' },
                  savedMessages: copiedData.savedMessages || [
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
                  tablePages: copiedData.tablePages || [],
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
