import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required config values
const requiredKeys = ['apiKey', 'authDomain', 'projectId'] as const;
const missingKeys = requiredKeys.filter(
  key => !firebaseConfig[key]
);

if (missingKeys.length > 0) {
  console.warn(
    `[Firebase] Missing environment variables: ${missingKeys.join(', ')}. ` +
    `Please set NEXT_PUBLIC_FIREBASE_* variables in your .env.local file.`
  );
}

// Only initialize Firebase if we have required config (client-side only)
let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;

if (typeof window !== 'undefined' && requiredKeys.every(key => firebaseConfig[key])) {
  try {
    // Initialize Firebase (only once)
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    // Initialize Auth
    auth = getAuth(app);

    // Set persistence for web
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.warn('[Firebase Auth] Failed to set persistence:', err);
    });

    // Initialize Firestore
    db = getFirestore(app);

    // Enable offline persistence for Firestore
    enableIndexedDbPersistence(db).catch(err => {
      if (err.code === 'failed-precondition') {
        console.warn('[Firestore] Multiple tabs open, persistence disabled');
      } else if (err.code === 'unimplemented') {
        console.warn('[Firestore] Browser does not support persistence');
      } else {
        console.warn('[Firestore] Persistence error:', err);
      }
    });

    // Initialize Storage
    storage = getStorage(app);

    // Optional: Connect to emulators in development
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      try {
        if (!auth.emulatorConfig) {
          connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        }
        if (!db.isShutdown && !process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST) {
          connectFirestoreEmulator(db, 'localhost', 8080);
        }
        if (!process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST) {
          connectStorageEmulator(storage, 'localhost', 9199);
        }
      } catch (error) {
        console.warn('[Firebase Emulator] Could not connect:', error);
      }
    }
  } catch (error) {
    console.warn('[Firebase] Initialization error:', error);
  }
}

export { app, auth, db, storage };
