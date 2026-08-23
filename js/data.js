// ============================================================================
// Firestore data access layer.
// Collections:
//   students/{studentId}          name, grade, phone, classDay, fee, regDate
//   attendance/{studentId_date}   studentId, date (YYYY-MM-DD), status, markedAt
//   payments/{studentId_month}    studentId, month (YYYY-MM), amount, paidDate
// ============================================================================

import { db } from "./firebase-config.js";
import {
  collection, doc, setDoc, getDoc, getDocs, deleteDoc,
  query, where, onSnapshot, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const studentsCol = collection(db, "students");
const attendanceCol = collection(db, "attendance");
const paymentsCol = collection(db, "payments");

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

/** Generates a fresh, unused document id under students/ without writing anything yet. */
export function newStudentId() {
  return doc(studentsCol).id;
}

export async function saveStudent(id, data) {
  const existing = await getDoc(doc(studentsCol, id));
  const payload = { ...data };
  if (!existing.exists()) payload.regDate = serverTimestamp();
  await setDoc(doc(studentsCol, id), payload, { merge: true });
}

export async function getStudent(id) {
  const snap = await getDoc(doc(studentsCol, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function deleteStudent(id) {
  await deleteDoc(doc(studentsCol, id));
}

/** Realtime listener over the full student list, sorted by name. */
export function listenStudents(callback) {
  return onSnapshot(studentsCol, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    callback(list);
  });
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

function attendanceDocId(studentId, dKey) { return `${studentId}_${dKey}`; }

export async function markPresent(studentId, dKey) {
  const id = attendanceDocId(studentId, dKey);
  await setDoc(doc(attendanceCol, id), {
    studentId, date: dKey, status: "present", markedAt: serverTimestamp()
  });
}

/** Returns a Set of date-keys ('YYYY-MM-DD') the student was marked present on, within the given list. */
export async function getPresentDates(studentId, dateKeys) {
  const q = query(attendanceCol, where("studentId", "==", studentId));
  const snap = await getDocs(q);
  const present = new Set();
  snap.forEach(d => {
    const data = d.data();
    if (dateKeys.includes(data.date)) present.add(data.date);
  });
  return present;
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

function paymentDocId(studentId, mKey) { return `${studentId}_${mKey}`; }

export async function recordPayment(studentId, mKey, amount) {
  const id = paymentDocId(studentId, mKey);
  await setDoc(doc(paymentsCol, id), {
    studentId, month: mKey, amount: Number(amount) || 0, paidDate: serverTimestamp()
  });
}

export async function getPaidMonths(studentId) {
  const q = query(paymentsCol, where("studentId", "==", studentId));
  const snap = await getDocs(q);
  const map = new Map(); // month -> amount
  snap.forEach(d => { const v = d.data(); map.set(v.month, v.amount); });
  return map;
}

/** Realtime listener over every payment record, for the reports tab. */
export function listenPayments(callback) {
  return onSnapshot(paymentsCol, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

export { Timestamp };
