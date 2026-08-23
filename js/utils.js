// ============================================================================
// Shared helpers used across every tab.
// ============================================================================

export const QR_PREFIX = "TUITIONREG::";

export const GRADES = [
  "Grade 1","Grade 2","Grade 3","Grade 4","Grade 5",
  "Grade 6","Grade 7","Grade 8","Grade 9","Grade 10",
  "Grade 11","Grade 12","Grade 13","Other"
];

export const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// First month payments are tracked from — change here if the term starts elsewhere.
export const PAYMENT_START_MONTH = "2026-08";

// ---------------------------------------------------------------------------
// Date / week / month helpers
// ---------------------------------------------------------------------------

/** YYYY-MM-DD in local time (never use toISOString — it shifts to UTC). */
export function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(mKey) {
  const [y, m] = mKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function shortDateLabel(dKey) {
  const [y, m, d] = dKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/** Every "YYYY-MM" from PAYMENT_START_MONTH through the current month, inclusive. */
export function monthRangeToNow(startMonth = PAYMENT_START_MONTH) {
  const [sy, sm] = startMonth.split("-").map(Number);
  const now = new Date();
  const months = [];
  let y = sy, m = sm;
  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

/**
 * The 4 most recent occurrences of `classDay` (weekday name) up to and
 * including today, oldest first. Each entry: { key: 'YYYY-MM-DD', isToday }
 */
export function recentClassDates(classDay, count = 4) {
  const targetIdx = WEEKDAYS.indexOf(classDay);
  const out = [];
  if (targetIdx === -1) return out;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  const diff = (cursor.getDay() - targetIdx + 7) % 7;
  cursor.setDate(cursor.getDate() - diff); // most recent occurrence <= today
  for (let i = 0; i < count; i++) {
    const key = dateKey(cursor);
    out.unshift({ key, isToday: key === dateKey(today) });
    cursor.setDate(cursor.getDate() - 7);
  }
  return out;
}

export function currency(n) {
  const v = Number(n) || 0;
  return "LKR " + v.toLocaleString("en-LK", { maximumFractionDigits: 0 });
}

export function initials(name) {
  return (name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastTimer = null;
export function showToast(msg, kind = "") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast show" + (kind ? " " + kind : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = "toast"; }, 2600);
}

// ---------------------------------------------------------------------------
// QR scanner — thin wrapper around html5-qrcode so each tab can start/stop
// a camera scan with a single callback.
// ---------------------------------------------------------------------------

const activeScanners = {};

export function startScanner(elementId, onDecoded, onError) {
  stopScanner(elementId);
  const scanner = new Html5Qrcode(elementId);
  activeScanners[elementId] = scanner;
  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 240, height: 240 } },
    (decodedText) => {
      onDecoded(decodedText);
    },
    () => { /* per-frame scan failure, ignore */ }
  ).catch((err) => {
    delete activeScanners[elementId];
    if (onError) onError(err);
  });
  return scanner;
}

export async function stopScanner(elementId) {
  const scanner = activeScanners[elementId];
  if (!scanner) return;
  delete activeScanners[elementId];
  try {
    await scanner.stop();
    scanner.clear();
  } catch (e) { /* already stopped */ }
}

export function el(id) { return document.getElementById(id); }
export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
