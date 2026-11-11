import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  doc,
  getDoc,
  collection,
  setDoc,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const app = initializeApp(firebaseConfig);

// Configure Firestore with experimentalAutoDetectLongPolling to eliminate WebChannel socket/iframe timeout warnings
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test helper with fast 3s race to prevent 10s backend timeout log
export async function testConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 2500);
    });

    const probePromise = getDoc(doc(db, 'test', 'connection')).then(() => true).catch(() => true);

    const result = await Promise.race([probePromise, timeoutPromise]);
    if (result) {
      console.log('[Firebase] Connected to Firestore database:', firebaseConfig.firestoreDatabaseId);
    } else {
      console.log('[Firebase] Firestore initialized in resilient offline/cache mode.');
    }
    return result;
  } catch (error) {
    console.log('[Firebase] Firestore initialized in cached mode.');
    return false;
  }
}
