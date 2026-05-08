/// <reference types="vite/client" />
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCYdXmh9qXZcKRhIM7tyPBE_uiFh1gGbHE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "live-snaps.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://live-snaps.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "live-snaps",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "live-snaps.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "915213540827",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:915213540827:web:fb522c2dd485a873791bfe",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEKL452J59"
};
