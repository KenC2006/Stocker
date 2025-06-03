import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Replace these values with your Firebase config from the Firebase Console
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyDJCbRIuE9pUoJNr_VYXD-GNSzgkJ0twcw",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "stockerstorage.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "stockerstorage",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "stockerstorage.firebasestorage.app",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "468105152049",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:468105152049:web:52419c6f170a04710d3710",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
