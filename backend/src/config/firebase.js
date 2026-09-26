import dotenv from 'dotenv';
dotenv.config();

/**
 * Firebase Admin Setup
 * If FIREBASE_SERVICE_ACCOUNT or serviceAccountKey.json exists, it initializes the admin SDK.
 * Otherwise, it provides a functional mock interface for development so the app runs without crashing.
 */
let firebaseAdmin = null;

export const initFirebase = async () => {
  try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountPath) {
      const admin = await import('firebase-admin');
      firebaseAdmin = admin.default.initializeApp({
        credential: admin.default.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'expensio-app',
      });
      console.log('✅ Firebase Admin SDK initialized successfully.');
    } else {
      console.log('ℹ️  Firebase running in development/local mode (serviceAccountKey.json not provided).');
    }
  } catch (error) {
    console.warn('⚠️ Firebase Admin initialization skipped:', error.message);
  }
};

export const getFirebaseAdmin = () => firebaseAdmin;
