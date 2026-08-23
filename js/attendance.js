import {
  el, showToast, startScanner, stopScanner, QR_PREFIX,
  recentClassDates, shortDateLabel, dateKey, initials
} from "./utils.js";
import { getStudent, markPresent, getPresentDates } from "./data.js";

const READER_ID = "reader-attendance";

const ICONS = {
  present: '<svg class="stamp-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
  absent: '<svg class="stamp-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  pending: '<svg class="stamp-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>'
};

function renderResult(student, tiles, note) {
  const box = el("attendanceResult");
  box.innerHTML = `
    <div class="id-card">
      <div class="id-tag">${student.classDay || "—"}</div>
      <div style="font-size:11px;color:#B9C0CC;letter-spacing:0.5px;">STUDENT</div>
      <h2>${escapeHtml(student.name)}</h2>
      <div class="id-meta">
        <span><b>${escapeHtml(student.grade || "—")}</b></span>
        <span>${escapeHtml(student.phone || "—")}</span>
      </div>
    </div>
    ${note ? `<div class="card-flat" style="margin-bottom:14px;font-size:13px;color:var(--text-muted);">${note}</div>` : ""}
    <div class="card">
      <div class="eyebrow">Last 4 weeks</div>
      <div class="stamp-row">
        ${tiles.map(t => `
          <div class="stamp ${t.status}">
            ${ICONS[t.status]}
            <span class="stamp-date">${shortDateLabel(t.key)}</span>
          </div>
        `).join("")}
      </div>
      <div class="stamp-legend">
        <span><i class="dot present"></i>Present</span>
        <span><i class="dot absent"></i>Absent</span>
        <span><i class="dot pending"></i>Upcoming</span>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

async function handleDecoded(text) {
  await stopScanner(READER_ID);
  el("attendanceScanBox").classList.add("hidden");

  if (!text.startsWith(QR_PREFIX)) {
    showToast("That QR code isn't a Tuition Register badge.", "err");
    return;
  }
  const id = text.slice(QR_PREFIX.length);
  const student = await getStudent(id);
  if (!student) {
    showToast("No student found for this badge. Register it first.", "err");
    return;
  }
  el("attendanceEmpty").classList.add("hidden");

  if (!student.classDay) {
    showToast("This student has no class day set — edit their record first.", "err");
    return;
  }

  const dates = recentClassDates(student.classDay, 4);
  const todayKey = dateKey(new Date());
  const isClassDayToday = dates.length && dates[dates.length - 1].key === todayKey;

  let note = "";
  if (isClassDayToday) {
    await markPresent(id, todayKey);
    note = `Marked present for today (${shortDateLabel(todayKey)}).`;
    showToast(`${student.name} marked present`, "ok");
  } else {
    note = `Today isn't ${student.name.split(" ")[0]}'s class day (${student.classDay}) — showing their record only, nothing was marked.`;
  }

  const presentSet = await getPresentDates(id, dates.map(d => d.key));
  const tiles = dates.map(d => ({
    key: d.key,
    status: presentSet.has(d.key) ? "present" : (d.key === todayKey ? "pending" : "absent")
  }));

  renderResult(student, tiles, note);
}

export function initAttendance() {
  el("btnScanAttendance").addEventListener("click", () => {
    el("attendanceResult").innerHTML = "";
    el("attendanceEmpty").classList.add("hidden");
    const box = el("attendanceScanBox");
    box.classList.remove("hidden");
    startScanner(READER_ID, handleDecoded, () => {
      showToast("Couldn't access the camera. Check permissions.", "err");
      box.classList.add("hidden");
      el("attendanceEmpty").classList.remove("hidden");
    });
  });
}
