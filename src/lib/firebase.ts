import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAFwxlWq3XNveCxxMnmS-abzbc7m9WMb-4",
  authDomain: "sa3aty-time-tracker.firebaseapp.com",
  projectId: "sa3aty-time-tracker",
  storageBucket: "sa3aty-time-tracker.firebasestorage.app",
  messagingSenderId: "1065292519768",
  appId: "1:1065292519768:web:d105915fb55ba4115dad2d",
  measurementId: "G-YPCQB0JMPC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not available in this browser');
  }
});

export default app;
