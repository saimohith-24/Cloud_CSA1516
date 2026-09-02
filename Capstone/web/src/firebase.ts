import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

/**
 * Firebase Configuration for cloud-capstone-7c2a9
 * 
 * NOTE ON CREDENTIALS:
 * Project ID: cloud-capstone-7c2a9
 * Project Number: 83769160977
 * 
 * TO GET YOUR ACTUAL apiKey AND appId:
 * 1. Open Firebase Console: https://console.firebase.google.com/
 * 2. Select Project: "cloud-capstone-7c2a9"
 * 3. Click the Gear icon ⚙️ (Project settings) -> General tab.
 * 4. Scroll down to "Your apps" section (or click "Add app" -> Web if not registered yet).
 * 5. Copy the 'apiKey' and 'appId' values from the Firebase SDK snippet and paste them below.
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_PLACEHOLDER", // Replace with apiKey from Firebase Console
  authDomain: "cloud-capstone-7c2a9.firebaseapp.com",
  projectId: "cloud-capstone-7c2a9",
  storageBucket: "cloud-capstone-7c2a9.appspot.com",
  messagingSenderId: "83769160977",
  appId: "YOUR_APP_ID_PLACEHOLDER", // Replace with appId from Firebase Console
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore Instance
const db = getFirestore(app);

// Connect to Local Firestore Emulator during local development (Spark no-cost plan setup)
// To enable connecting to the local Firestore emulator, set USE_FIREBASE_EMULATOR to true
// or run the Firebase emulator on port 8080.
const USE_EMULATOR = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' || false;

if (USE_EMULATOR) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to local Firestore emulator at localhost:8080');
  } catch (error) {
    console.warn('Firestore emulator connection failed or already connected:', error);
  }
}

export { app, db };
