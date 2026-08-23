import { el, qs, showToast, startScanner, stopScanner, QR_PREFIX, GRADES } from "./utils.js";
import { newStudentId, saveStudent, getStudent, deleteStudent } from "./data.js";

const READER_ID = "reader-register";

function populateGrades() {
  const sel = el("regGrade");
  GRADES.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g; opt.textContent = g;
    sel.appendChild(opt);
  });
}

function resetPanel() {
  stopScanner(READER_ID);
  el("registerScanBox").classList.add("hidden");
  el("registerQrPreview").classList.add("hidden");
  el("registerQrPreview").innerHTML = "";
  el("registerForm").classList.add("hidden");
  el("registerForm").reset();
  el("registerEmpty").classList.remove("hidden");
}

function renderQr(payload, container) {
  container.innerHTML = "";
  container.classList.remove("hidden");
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);
  QRCode.toCanvas(canvas, payload, { width: 190, margin: 1, color: { dark: "#161D27", light: "#FAF7F0" } });

  const dl = document.createElement("button");
  dl.type = "button";
  dl.className = "link-btn";
  dl.textContent = "Download badge image";
  dl.style.display = "block";
  dl.style.margin = "10px auto 0";
  dl.onclick = () => {
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qr-${payload.replace(QR_PREFIX, "")}.png`;
    a.click();
  };
  container.appendChild(dl);
}

function openForm(studentId, existing) {
  el("registerEmpty").classList.add("hidden");
  el("registerForm").classList.remove("hidden");
  el("regStudentId").value = studentId;
  el("regFormMode").textContent = existing ? "Editing existing student" : "New student";
  el("regName").value = existing?.name || "";
  el("regGrade").value = existing?.grade || "";
  el("regPhone").value = existing?.phone || "";
  el("regClassDay").value = existing?.classDay || "";
  el("regFee").value = existing?.fee ?? "";
  el("regDelete").classList.toggle("hidden", !existing);
  el("regName").focus();
}

async function handleDecoded(text) {
  await stopScanner(READER_ID);
  el("registerScanBox").classList.add("hidden");

  if (!text.startsWith(QR_PREFIX)) {
    showToast("That QR code isn't a Tuition Register badge.", "err");
    el("registerEmpty").classList.remove("hidden");
    return;
  }
  const id = text.slice(QR_PREFIX.length);
  const existing = await getStudent(id);
  renderQr(text, el("registerQrPreview"));
  showToast(existing ? `Loaded ${existing.name} for editing` : "New badge — fill in the details below");
  openForm(id, existing);
}

/** Opens a known student directly in the edit form (used by the Student Master tab). */
export async function editStudentById(id) {
  stopScanner(READER_ID);
  el("registerScanBox").classList.add("hidden");
  const existing = await getStudent(id);
  if (!existing) { showToast("Student not found", "err"); return; }
  el("registerEmpty").classList.add("hidden");
  renderQr(QR_PREFIX + id, el("registerQrPreview"));
  openForm(id, existing);
}

export function initRegister() {
  populateGrades();

  el("btnGenerateQr").addEventListener("click", () => {
    stopScanner(READER_ID);
    el("registerScanBox").classList.add("hidden");
    const id = newStudentId();
    const payload = QR_PREFIX + id;
    renderQr(payload, el("registerQrPreview"));
    el("registerEmpty").classList.add("hidden");
    openForm(id, null);
    showToast("New badge generated — save it after filling the form");
  });

  el("btnScanRegister").addEventListener("click", () => {
    el("registerForm").classList.add("hidden");
    el("registerQrPreview").classList.add("hidden");
    el("registerEmpty").classList.add("hidden");
    const box = el("registerScanBox");
    box.classList.remove("hidden");
    startScanner(READER_ID, handleDecoded, () => {
      showToast("Couldn't access the camera. Check permissions.", "err");
      resetPanel();
    });
  });

  el("regCancel").addEventListener("click", (e) => {
    e.preventDefault();
    resetPanel();
  });

  el("regDelete").addEventListener("click", async () => {
    const id = el("regStudentId").value;
    const name = el("regName").value || "this student";
    if (!confirm(`Remove ${name}? This can't be undone.`)) return;
    try {
      await deleteStudent(id);
      showToast("Student removed", "ok");
      resetPanel();
    } catch (err) {
      console.error(err);
      showToast("Couldn't remove — check your connection", "err");
    }
  });

  el("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = el("regStudentId").value;
    const btn = el("regSubmit");
    btn.disabled = true;
    btn.textContent = "Saving…";
    try {
      await saveStudent(id, {
        name: el("regName").value.trim(),
        grade: el("regGrade").value,
        phone: el("regPhone").value.trim(),
        classDay: el("regClassDay").value,
        fee: Number(el("regFee").value) || 0
      });
      showToast("Student saved", "ok");
      resetPanel();
    } catch (err) {
      console.error(err);
      showToast("Couldn't save — check your connection", "err");
    } finally {
      btn.disabled = false;
      btn.textContent = "Save student";
    }
  });
}
