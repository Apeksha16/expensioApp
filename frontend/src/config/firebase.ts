/**
 * Firebase Client Configuration for Expensio Mobile App
 * 
 * To connect to your real Firebase project:
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Create a project named "Expensio"
 * 3. Add iOS / Android / Web apps and copy your firebaseConfig keys below.
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForExpensioApp2026",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "expensio-mobile.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "expensio-mobile",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "expensio-mobile.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456",
};

export const isFirebaseConfigured = () => {
  return !firebaseConfig.apiKey.includes('Dummy');
};
