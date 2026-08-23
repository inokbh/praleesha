import {
  el, showToast, startScanner, stopScanner, QR_PREFIX,
  monthRangeToNow, monthLabel, currency
} from "./utils.js";
import { getStudent, getPaidMonths, recordPayment } from "./data.js";

const READER_ID = "reader-payment";
let currentStudent = null;
let currentPaidMap = null;
let selected = new Set();

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

async function refreshPending() {
  currentPaidMap = await getPaidMonths(currentStudent.id);
  const allMonths = monthRangeToNow();
  const pending = allMonths.filter(m => !currentPaidMap.has(m));
  selected = new Set();
  renderPaymentUI(pending);
}

function renderPaymentUI(pending) {
  const box = el("paymentResult");

  const header = `
    <div class="id-card">
      <div class="id-tag">${escapeHtml(currentStudent.grade || "—")}</div>
      <div style="font-size:11px;color:#B9C0CC;letter-spacing:0.5px;">STUDENT</div>
      <h2>${escapeHtml(currentStudent.name)}</h2>
      <div class="id-meta">
        <span>${escapeHtml(currentStudent.phone || "—")}</span>
        <span><b>${currency(currentStudent.fee)}</b> / month</span>
      </div>
    </div>
  `;

  if (pending.length === 0) {
    box.innerHTML = header + `
      <div class="card" style="text-align:center;">
        <span class="paid-pill">Up to date</span>
        <p style="margin:10px 0 0;color:var(--text-muted);font-size:13.5px;">
          All monthly payments are recorded through ${monthLabel(monthRangeToNow().slice(-1)[0])}.
        </p>
      </div>
    `;
    return;
  }

  const rows = pending.map(m => `
    <div class="month-row" data-month="${m}">
      <div>
        <div class="m-name">${monthLabel(m)}</div>
        <div class="m-fee">${currency(currentStudent.fee)}</div>
      </div>
      <div class="m-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
    </div>
  `).join("");

  box.innerHTML = header + `
    <div class="card">
      <div class="eyebrow">Pending months (${pending.length})</div>
      <div id="monthRows">${rows}</div>
    </div>
    <button class="btn btn-primary" id="btnMarkPaid" disabled>Select a month to record payment</button>
  `;

  el("monthRows").querySelectorAll(".month-row").forEach(row => {
    row.addEventListener("click", () => {
      const m = row.dataset.month;
      if (selected.has(m)) selected.delete(m); else selected.add(m);
      row.classList.toggle("selected", selected.has(m));
      updateMarkPaidButton();
    });
  });

  updateMarkPaidButton();
}

function updateMarkPaidButton() {
  const btn = el("btnMarkPaid");
  if (!btn) return;
  if (selected.size === 0) {
    btn.disabled = true;
    btn.textContent = "Select a month to record payment";
    return;
  }
  btn.disabled = false;
  const total = currentStudent.fee * selected.size;
  btn.textContent = `Mark ${selected.size} month${selected.size > 1 ? "s" : ""} as paid — ${currency(total)}`;
  btn.onclick = confirmPayment;
}

async function confirmPayment() {
  const btn = el("btnMarkPaid");
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    for (const m of selected) {
      await recordPayment(currentStudent.id, m, currentStudent.fee);
    }
    showToast(`Payment recorded for ${selected.size} month${selected.size > 1 ? "s" : ""}`, "ok");
    await refreshPending();
  } catch (err) {
    console.error(err);
    showToast("Couldn't save payment — check your connection", "err");
    updateMarkPaidButton();
  }
}

async function handleDecoded(text) {
  await stopScanner(READER_ID);
  el("paymentScanBox").classList.add("hidden");

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
  el("paymentEmpty").classList.add("hidden");
  currentStudent = student;
  await refreshPending();
}

export function initPayment() {
  el("btnScanPayment").addEventListener("click", () => {
    el("paymentResult").innerHTML = "";
    el("paymentEmpty").classList.add("hidden");
    const box = el("paymentScanBox");
    box.classList.remove("hidden");
    startScanner(READER_ID, handleDecoded, () => {
      showToast("Couldn't access the camera. Check permissions.", "err");
      box.classList.add("hidden");
      el("paymentEmpty").classList.remove("hidden");
    });
  });
}
