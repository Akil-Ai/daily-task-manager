import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

let db: Firestore | null = null;
let auth: Auth | null = null;
let initializedConfig: FirebaseConfig | null = null;

const getEnvConfig = (): FirebaseConfig | null => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (apiKey && authDomain && projectId) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }
  return null;
};

const getStoredConfig = (): FirebaseConfig | null => {
  try {
    const stored = localStorage.getItem('flowtodo_firebase_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse stored firebase config:', e);
  }
  return null;
};

export const getFirebaseInstance = () => {
  return { db, auth, isConfigured: !!db && !!auth, config: initializedConfig };
};

export const initializeFirebase = (config: FirebaseConfig | null = null): boolean => {
  const activeConfig = config || getEnvConfig() || getStoredConfig();
  if (!activeConfig) {
    db = null;
    auth = null;
    initializedConfig = null;
    return false;
  }

  try {
    const apps = getApps();
    apps.forEach((app) => deleteApp(app));

    const app = initializeApp(activeConfig);
    auth = getAuth(app);
    
    // Use the modern API for persistence in Firestore SDK v9+ / v10+
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    
    initializedConfig = activeConfig;
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    db = null;
    auth = null;
    initializedConfig = null;
    return false;
  }
};

export const saveFirebaseConfig = (config: FirebaseConfig): boolean => {
  localStorage.setItem('flowtodo_firebase_config', JSON.stringify(config));
  return initializeFirebase(config);
};

export const clearFirebaseConfig = (): void => {
  localStorage.removeItem('flowtodo_firebase_config');
  initializeFirebase(null);
};

// Auto-run on load
initializeFirebase();
