
import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  getDocs, 
  writeBatch,
} from 'firebase/firestore';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

// Re-export config so AppContext can use it for error handling
export { firebaseConfig };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with persistent local cache (multi-tab supported)
// This replaces the deprecated enableMultiTabIndexedDbPersistence()
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  ignoreUndefinedProperties: true
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
    const collectionsToDelete = ['items', 'receipts', 'printers', 'saved_tickets', 'custom_grids', 'config'];
    const batch = writeBatch(db);

    const snapshotPromises = collectionsToDelete.map(collName => 
        getDocs(collection(db, 'users', uid, collName))
    );

    const snapshots = await Promise.all(snapshotPromises);

    snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
    });

    await batch.commit();
};


export { db, auth };
