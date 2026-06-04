import admin from "firebase-admin";

let firebaseInitialized = false;

export const initializeFirebase = (): boolean => {
  try {
    if (firebaseInitialized) return true;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.warn("Firebase credentials not found");
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });

    firebaseInitialized = true;

    console.log("✅ Firebase initialized successfully");

    return true;
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    return false;
  }
};

export const isFirebaseConfigured = (): boolean => {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
};

export default admin;