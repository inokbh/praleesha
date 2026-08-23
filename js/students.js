import { el, qsa, initials, GRADES } from "./utils.js";
import { listenStudents } from "./data.js";
import { editStudentById } from "./register.js";
import { switchTab } from "./app.js";

let allStudents = [];
let activeGrade = "All";

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
    row.innerHTML = `
      <div class="stu-avatar">${initials(s.name)}</div>
      <div class="stu-info">
        <div class="stu-name">${escapeHtml(s.name || "Unnamed")}</div>
        <div class="stu-sub">${escapeHtml(s.classDay || "—")} · ${escapeHtml(s.phone || "—")}</div>
      </div>
      <div class="grade-pill">${escapeHtml(s.grade || "—")}</div>
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
  listenStudents(list => { allStudents = list; render(); });
  el("studentSearch").addEventListener("input", render);
}
