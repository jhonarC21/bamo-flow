import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  collection,
  getDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Collection doc sync key helper
const CONFIG_DOC_ID = 'main_app_state';

export interface SyncedAppState {
  appConfig?: any;
  spots?: any[];
  vehicles?: any[];
  history?: any[];
  appointments?: any[];
  storeItems?: any[];
  storeSales?: any[];
  clientUsers?: any[];
  clientReviews?: any[];
  expenses?: any[];
  rateConfig?: any;
}

// Subscribe to real-time updates from Firestore
export function subscribeToRealtimeState(
  onData: (data: Partial<SyncedAppState>) => void,
  onError?: (err: Error) => void
) {
  try {
    const docRef = doc(db, 'system_data', CONFIG_DOC_ID);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onData(snapshot.data() as SyncedAppState);
        }
      },
      (err) => {
        console.warn('Firestore real-time subscription error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to setup real-time listener:', err);
    return () => {};
  }
}

// Push state changes to Firestore in real-time
export async function saveRealtimeState(partialState: Partial<SyncedAppState>) {
  try {
    const docRef = doc(db, 'system_data', CONFIG_DOC_ID);
    await setDoc(docRef, partialState, { merge: true });
  } catch (err) {
    console.warn('Error saving real-time state to Firestore:', err);
  }
}
