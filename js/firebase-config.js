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

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfKwZVp7_berT1hhOcVnlkgsN1ceifyD4",
  authDomain: "praleesha-ab618.firebaseapp.com",
  databaseURL: "https://praleesha-ab618-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "praleesha-ab618",
  storageBucket: "praleesha-ab618.firebasestorage.app",
  messagingSenderId: "72038159089",
  appId: "1:72038159089:web:06cb6fb930feeb05f18f50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);

// Best-effort offline cache so the roll-call still works on a shaky
// classroom wifi connection. Safe to ignore if it fails (e.g. private tab).
try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) { /* no-op */ }
