import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import * as firebaseAuth from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
};
const firebaseConfig2 = {
  apiKey: process.env.FIREBASE_APIKEY2,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN2,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID2,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET2,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID2,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID2,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID2,
};

// Initialize the default app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const auth = firebaseAuth.getAuth(app);
const googleProvider = new firebaseAuth.GoogleAuthProvider();
const signInWithEmail = (email: string, password: string) => {
  return firebaseAuth
    .signInWithEmailAndPassword(auth, email, password)
    .then((res) => {
      return res.user;
    })
    .catch((error) => {
      console.log(error.message);
      throw Error(error.message);
    });
};

const signInWithGoogle = () => {
  return firebaseAuth
    .signInWithPopup(auth, googleProvider)
    .then((res) => {
      console.log(res.user);
      return res.user;
    })
    .catch((error) => {
      console.log(error.message);
      alert(error.message);
    });
};

// Initialize the second app with a custom name
const app2 = initializeApp(firebaseConfig2, 'secondary');
const db2 = getFirestore(app2);

export { db, db2, signInWithGoogle, signInWithEmail };
