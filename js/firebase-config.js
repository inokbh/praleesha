// ============================================================================
// Firebase configuration
// ----------------------------------------------------------------------------
// 1. Go to https://console.firebase.google.com -> your project -> Project
//    settings -> General -> "Your apps" -> Web app -> copy the config object.
// 2. Paste your real values below (these are safe to expose publicly on
//    GitHub Pages — access control is enforced by Firestore Security Rules,
//    not by hiding this config).
// 3. Enable Firestore Database in the Firebase console (Build > Firestore
//    Database > Create database). Start in production mode and use the
//    rules in firestore.rules (see README.md).
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);

// Best-effort offline cache so the roll-call still works on a shaky
// classroom wifi connection. Safe to ignore if it fails (e.g. private tab).
try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) { /* no-op */ }
