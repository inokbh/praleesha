import {
  el, currency, monthRangeToNow, monthKey, monthLabel, dateKey, shortDateLabel
} from "./utils.js";
import { listenPayments, listenStudents } from "./data.js";

let payments = [];
let students = [];
let charts = {};

const AMBER = "#E8A33D";
const INK = "#161D27";
const PRESENT = "#2F9E5B";
const GRID = "#E4DCC8";

function studentMap() {
  const m = new Map();
  students.forEach(s => m.set(s.id, s));
  return m;
}

// ---- week helpers (Monday-start) -----------------------------------------

function weekStart(d) {
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? 6 : day - 1); // days since Monday
  const ws = new Date(d);
  ws.setHours(0, 0, 0, 0);
  ws.setDate(ws.getDate() - diff);
  return ws;
}

function last8WeekKeys() {
  const out = [];
  let cursor = weekStart(new Date());
  for (let i = 0; i < 8; i++) {
    out.unshift(dateKey(cursor));
    cursor.setDate(cursor.getDate() - 7);
  }
  return out;
}

function paymentDate(p) {
  if (!p.paidDate || typeof p.paidDate.toDate !== "function") return null;
  return p.paidDate.toDate();
}

// ---- chart rendering --------------------------------------------------

function drawBarChart(canvasId, labels, data, color) {
  const ctx = document.getElementById(canvasId);
  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ data, backgroundColor: color, borderRadius: 5, maxBarThickness: 34 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: (c) => currency(c.parsed.y) }
      }},
      scales: {
        y: { beginAtZero: true, grid: { color: GRID }, ticks: { callback: (v) => "LKR " + v } },
        x: { grid: { display: false } }
      }
    }
  });
}

function render() {
  const sMap = studentMap();
  const now = new Date();
  const curMonth = monthKey(now);
  const curWeek = dateKey(weekStart(now));

  // ---- stat boxes ----
  const monthTotal = payments.filter(p => p.month === curMonth).reduce((s, p) => s + (p.amount || 0), 0);
  const weekTotal = payments.filter(p => {
    const d = paymentDate(p);
    return d && dateKey(weekStart(d)) === curWeek;
  }).reduce((s, p) => s + (p.amount || 0), 0);
  el("statThisMonth").textContent = currency(monthTotal);
  el("statThisWeek").textContent = currency(weekTotal);

  // ---- weekly chart (last 8 weeks) ----
  const weekKeys = last8WeekKeys();
  const weekTotals = weekKeys.map(wk =>
    payments.filter(p => {
      const d = paymentDate(p);
      return d && dateKey(weekStart(d)) === wk;
    }).reduce((s, p) => s + (p.amount || 0), 0)
  );
  drawBarChart("chartWeekly", weekKeys.map(shortDateLabel), weekTotals, AMBER);

  // ---- monthly chart ----
  const months = monthRangeToNow();
  const monthTotals = months.map(mk =>
    payments.filter(p => p.month === mk).reduce((s, p) => s + (p.amount || 0), 0)
  );
  drawBarChart("chartMonthly", months.map(m => monthLabel(m).replace(" 20", " '").slice(0, 9)), monthTotals, INK);

  // ---- grade-wise chart (this month) ----
  const gradeTotals = {};
  payments.filter(p => p.month === curMonth).forEach(p => {
    const stu = sMap.get(p.studentId);
    const g = stu?.grade || "Unknown";
    gradeTotals[g] = (gradeTotals[g] || 0) + (p.amount || 0);
  });
  const gradeLabels = Object.keys(gradeTotals).sort();
  drawBarChart("chartGrade", gradeLabels, gradeLabels.map(g => gradeTotals[g]), PRESENT);

  renderHistory();
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

function renderHistory() {
  const term = (el("historySearch").value || "").trim().toLowerCase();
  const box = el("historyResults");
  if (!term) { box.innerHTML = ""; return; }

  const matches = students.filter(s => (s.name || "").toLowerCase().includes(term)).slice(0, 6);
  if (matches.length === 0) {
    box.innerHTML = `<div class="empty-state" style="padding:20px 4px;"><p>No students match "${escapeHtml(term)}".</p></div>`;
    return;
  }

  box.innerHTML = matches.map(s => {
    const own = payments.filter(p => p.studentId === s.id).sort((a, b) => a.month.localeCompare(b.month));
    const total = own.reduce((sum, p) => sum + (p.amount || 0), 0);
    const rows = own.length
      ? own.map(p => `
          <div class="month-row" style="cursor:default;">
            <div>
              <div class="m-name">${monthLabel(p.month)}</div>
              <div class="m-fee">${p.month === monthKey(new Date()) ? "Current month" : ""}</div>
            </div>
            <span class="paid-pill">${currency(p.amount)}</span>
          </div>
        `).join("")
      : `<p style="color:var(--text-muted);font-size:13px;margin:6px 0 0;">No payments recorded yet.</p>`;

    return `
      <div class="card-flat" style="margin-top:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <div style="font-weight:700;font-size:14.5px;">${escapeHtml(s.name)}</div>
            <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(s.grade || "—")}</div>
          </div>
          <div style="font-family:var(--font-display);font-weight:700;font-size:16px;">${currency(total)}</div>
        </div>
        ${rows}
      </div>
    `;
  }).join("");
}

export function initReports() {
  listenPayments(list => { payments = list; render(); });
  listenStudents(list => { students = list; render(); });
  el("historySearch").addEventListener("input", renderHistory);
}
