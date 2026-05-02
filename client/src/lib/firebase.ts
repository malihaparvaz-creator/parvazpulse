// Parvaz Pulse — Firebase
// Firestore sync. Works offline. No auth needed.

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBh9xAPAkQHegnYAhUhAUG3txiUz6n6MVE",
  authDomain: "parvazpulse.firebaseapp.com",
  projectId: "parvazpulse",
  storageBucket: "parvazpulse.firebasestorage.app",
  messagingSenderId: "757996438585",
  appId: "1:757996438585:web:04e54f1699fe3d4d0e39e8",
  measurementId: "G-STKMYQYEQ1",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const messaging = getMessaging(app);

const OWNER_KEY = 'parvazpulse-owner';

export function getUserId(): string {
  let id = localStorage.getItem(OWNER_KEY);
  if (!id) {
    id = 'pulse-owner-main';
    localStorage.setItem(OWNER_KEY, id);
  }
  return id;
}

function hydrateDates(obj: any): any {
  if (obj instanceof Timestamp) return obj.toDate();
  if (Array.isArray(obj)) return obj.map(hydrateDates);
  if (obj && typeof obj === 'object') {
    const out: any = {};
    for (const k of Object.keys(obj)) out[k] = hydrateDates(obj[k]);
    return out;
  }
  return obj;
}

export async function loadAllFromFirestore(): Promise<any | null> {
  try {
    const snap = await getDoc(doc(db, 'users', getUserId()));
    if (!snap.exists()) return null;
    return hydrateDates(snap.data()?.state ?? null);
  } catch {
    return null;
  }
}

export function saveAllToFirestore(state: any): void {
  try {
    setDoc(
      doc(db, 'users', getUserId()),
      { state: JSON.parse(JSON.stringify(state)), updatedAt: Timestamp.now() },
      { merge: true }
    ).catch(() => {});
  } catch {}
}
