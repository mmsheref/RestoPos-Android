
// FIX: Update Firebase SDK usage. `initializeFirestore` is deprecated. The modern way to enable multi-tab persistence
// is with `getFirestore` and `enableMultiTabIndexedDbPersistence`. This resolves the module resolution error.
import { initializeApp } from 'firebase/app';
import { 
  getFirestore,
  enableMultiTabIndexedDbPersistence,
  collection, 
  doc, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import type { User, AuthCredential } from 'firebase/auth';
// IMPORT the config from the separate file (which CI/CD will generate)
import { firebaseConfig } from './firebaseConfig';

// Re-export config so AppContext can use it for error handling
export { firebaseConfig };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

enableMultiTabIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn(
        'Firebase persistence failed. This may happen when multiple tabs are open. Offline functionality will be limited.'
      );
    } else if (err.code == 'unimplemented') {
      console.info(
        'The current browser does not support all features required to enable offline persistence.'
      );
    }
  });


// --- Auth Functions ---
export const signUp = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const signIn = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const signOutUser = () => signOut(auth);

export const getFirebaseErrorMessage = (error: any): string => {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'This email address is already in use.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters long.';
        default:
            return error.message || 'An unexpected error occurred.';
    }
}

// --- Data Operations ---
export const clearAllData = async (uid: string) => {
    const collections = ['items', 'receipts', 'printers', 'saved_tickets', 'custom_grids', 'config'];
    const batch = writeBatch(db);
    
    for (const coll of collections) {
        const collRef = collection(db, 'users', uid, coll);
        const snapshot = await getDocs(collRef);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
    }
    
    await batch.commit();
}

export { db, auth };
