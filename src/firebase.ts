import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setLogLevel } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Silence internal SDK connection and retry notices so non-critical offline warnings do not pollute the console
try {
  setLogLevel('silent');
} catch {
  // ignore
}

// Initialize Firestore strictly matching the Firebase skill instructions
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Fast connection check with graceful fallback
export async function testFirestoreConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  try {
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 2000);
    });

    const checkPromise = getDoc(doc(db, 'cheats', 'cheat_max_health_armor'))
      .then((snap) => snap.exists())
      .catch(() => false);

    return await Promise.race([checkPromise, timeoutPromise]);
  } catch {
    return false;
  }
}

