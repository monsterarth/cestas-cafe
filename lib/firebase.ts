import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let initializationAttempted = false

// Check if Firebase is properly configured
function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  )
}

// Initialize Firebase app lazily and safely
function initializeFirebaseApp(): FirebaseApp | null {
  if (initializationAttempted && !app) {
    return null // Already tried and failed
  }

  if (!isFirebaseConfigured()) {
    console.warn("Firebase configuration is incomplete")
    initializationAttempted = true
    return null
  }

  try {
    if (!app) {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    }
    return app
  } catch (error) {
    console.error("Failed to initialize Firebase app:", error)
    initializationAttempted = true
    return null
  }
}

// Get Firebase Auth instance - only call when you actually need to use auth
export async function getFirebaseAuth(): Promise<Auth | null> {
  try {
    const firebaseApp = initializeFirebaseApp()
    if (!firebaseApp) return null

    if (!auth) {
      auth = getAuth(firebaseApp)
    }
    return auth
  } catch (error) {
    console.error("Failed to initialize Firebase Auth:", error)
    return null
  }
}

// Get Firestore instance - only call when you actually need to use firestore
export async function getFirebaseDb(): Promise<Firestore | null> {
  try {
    const firebaseApp = initializeFirebaseApp()
    if (!firebaseApp) return null

    if (!db) {
      db = getFirestore(firebaseApp)
    }
    return db
  } catch (error) {
    console.error("Failed to initialize Firestore:", error)
    return null
  }
}

// Helper function to check if Firebase is available
export function isFirebaseAvailable(): boolean {
  return isFirebaseConfigured()
}

// Export for backward compatibility (but these might be null)
export { app }
