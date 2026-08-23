import { el, qsa } from "./utils.js";
import { initRegister } from "./register.js";
import { initStudents } from "./students.js";
import { initAttendance } from "./attendance.js";
import { initPayment } from "./payment.js";
import { initReports } from "./reports.js";

const TAB_LABELS = {
  register: "Register",
  students: "Student master",
  attendance: "Mark attendance",
  payment: "Record payment",
  reports: "Payment history"
};

export function switchTab(name) {
  qsa(".tab-panel").forEach(p => p.classList.toggle("active", p.id === `tab-${name}`));
  qsa(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  el("pageLabel").textContent = TAB_LABELS[name] || "";
  window.scrollTo(0, 0);
}

function initNav() {
  qsa(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initRegister();
  initStudents();
  initAttendance();
  initPayment();
  initReports();
});
