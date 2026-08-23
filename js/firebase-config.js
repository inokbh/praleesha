import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfKwZVp7_berT1hhOcVnlkgsN1ceifyD4",
  authDomain: "praleesha-ab618.firebaseapp.com",
  databaseURL: "https://praleesha-ab618-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "praleesha-ab618",
  storageBucket: "praleesha-ab618.firebasestorage.app",
  messagingSenderId: "72038159089",
  appId: "1:72038159089:web:06cb6fb930feeb05f18f50"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);

try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (e) { /* no-op */ }
