import { el, qsa, initials, GRADES, recentClassDates, dateKey, monthLabel } from "./utils.js";
import { listenStudents, getPresentDates, getPaidMonths } from "./data.js";
import { editStudentById } from "./register.js";
import { switchTab } from "./app.js";

let allStudents = [];
let activeGrade = "All";
const extraCache = new Map(); // studentId -> { tiles: [{status}], lastPaidMonth }
const inFlight = new Set();

async function fetchExtra(student) {
  if (inFlight.has(student.id)) return;
  inFlight.add(student.id);
  try {
    const dates = student.classDay ? recentClassDates(student.classDay, 4) : [];
    const todayKey = dateKey(new Date());
    const [presentSet, paidMap] = await Promise.all([
      dates.length ? getPresentDates(student.id, dates.map(d => d.key)) : Promise.resolve(new Set()),
      getPaidMonths(student.id)
    ]);
    const tiles = dates.map(d => ({
      status: presentSet.has(d.key) ? "present" : (d.key === todayKey ? "pending" : "absent")
    }));
    const lastPaidMonth = paidMap.size ? [...paidMap.keys()].sort().slice(-1)[0] : null;
    extraCache.set(student.id, { tiles, lastPaidMonth });
  } catch (err) {
    console.error("Couldn't load attendance/payment summary for", student.id, err);
    extraCache.set(student.id, { tiles: [], lastPaidMonth: null, error: true });
  } finally {
    inFlight.delete(student.id);
  }
}

function buildChips() {
  const row = el("gradeFilterChips");
  const grades = ["All", ...GRADES];
  row.innerHTML = "";
  grades.forEach(g => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (g === activeGrade ? " active" : "");
    chip.textContent = g;
    chip.addEventListener("click", () => {
      activeGrade = g;
      qsa(".chip", row).forEach(c => c.classList.toggle("active", c.textContent === g));
      render();
    });
    row.appendChild(chip);
  });
}

function render() {
  const term = (el("studentSearch").value || "").trim().toLowerCase();
  const filtered = allStudents.filter(s => {
    const matchesGrade = activeGrade === "All" || s.grade === activeGrade;
    const matchesTerm = !term ||
      (s.name || "").toLowerCase().includes(term) ||
      (s.phone || "").toLowerCase().includes(term);
    return matchesGrade && matchesTerm;
  });

  const list = el("studentList");
  const empty = el("studentListEmpty");
  list.innerHTML = "";

  if (filtered.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  filtered.forEach(s => {
    const row = document.createElement("div");
    row.className = "stu-row";
    row.style.cursor = "pointer";

    const extra = extraCache.get(s.id);
    if (!extra) {
      fetchExtra(s).then(() => render());
    }

    const tilesHtml = (extra?.tiles?.length ? extra.tiles : [null, null, null, null])
      .map(t => `<span class="mini-stamp ${t ? t.status : "pending"}"></span>`).join("");
    const paidText = extra
      ? (extra.error ? "Couldn't load" : (extra.lastPaidMonth ? `Paid through ${monthLabel(extra.lastPaidMonth)}` : "No payments yet"))
      : "Loading…";

    row.innerHTML = `
      <div class="stu-row-main">
        <div class="stu-avatar">${initials(s.name)}</div>
        <div class="stu-info">
          <div class="stu-name">${escapeHtml(s.name || "Unnamed")}</div>
          <div class="stu-sub">${escapeHtml(s.classDay || "—")} · ${escapeHtml(s.phone || "—")}</div>
        </div>
        <div class="grade-pill">${escapeHtml(s.grade || "—")}</div>
      </div>
      <div class="stu-row-extra">
        <span class="mini-paid">${paidText}</span>
        <div class="mini-stamps">${tilesHtml}</div>
      </div>
    `;
    row.addEventListener("click", async () => {
      switchTab("register");
      await editStudentById(s.id);
    });
    list.appendChild(row);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

export function initStudents() {
  buildChips();
  listenStudents(list => { allStudents = list; extraCache.clear(); render(); });
  el("studentSearch").addEventListener("input", render);
}
