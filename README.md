# Tuition Register

A mobile-first, QR-based attendance and monthly payment tracker for tuition
classes — five tabs (Register, Student master, Attendance, Payment, Reports),
backed by Firebase Firestore, deployable as a free static site on GitHub Pages.

No build step, no framework, no server — plain HTML/CSS/JS. The three
third-party libraries (QR generation, QR scanning, charts) are bundled inside
`assets/vendor/` rather than loaded from a CDN, so the app keeps working even
on networks or browser extensions that block `cdn.jsdelivr.net`.

---

## 1. Create the Firebase project (~5 minutes)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and
   create a new project (Google Analytics is optional — you can turn it off).
2. In the left sidebar go to **Build → Firestore Database → Create database**.
   Choose a location close to Sri Lanka (e.g. `asia-south1`), and start in
   **Production mode**.
3. In **Project settings → General → Your apps**, click the **Web** icon
   (`</>`) to register a new web app. You don't need Firebase Hosting — just
   copy the `firebaseConfig` object it shows you.
4. Open `js/firebase-config.js` in this project and paste your real values
   into the `firebaseConfig` object, replacing the `YOUR_...` placeholders.
   These values are safe to publish — Firestore access is controlled by the
   **rules**, not by hiding this file.
5. In Firestore, go to the **Rules** tab and paste the contents of
   [`firestore.rules`](firestore.rules) from this project, then click
   **Publish**. That file also explains how to lock the database down to
   signed-in staff once more than one person is using it.

That's the entire backend — three collections (`students`, `attendance`,
`payments`) are created automatically the first time you use each feature.

---

## 2. Run it locally (optional, to test before publishing)

Because the app uses ES modules and requests camera access, it must be served
over `http://` or `https://` — opening `index.html` directly by double
clicking it (`file://`) will **not** work.

From this folder, run any static server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` on your phone (same wifi network, replace
`localhost` with your computer's local IP) or in your desktop browser to test
the camera scanner.

---

## 3. Publish to GitHub Pages (~2 minutes)

1. Create a new **public** GitHub repository (e.g. `tuition-register`).
2. Push everything in this folder to the repository:

   ```bash
   cd tuition-tracker
   git init
   git add .
   git commit -m "Tuition Register app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/tuition-register.git
   git push -u origin main
   ```

3. In the repo on GitHub, go to **Settings → Pages**. Under **Build and
   deployment**, set **Source** to `Deploy from a branch`, branch `main`,
   folder `/ (root)`, then **Save**.
4. After a minute your site is live at
   `https://<your-username>.github.io/tuition-register/`. GitHub Pages is
   served over HTTPS, so the camera scanner will work out of the box.
5. On your phone, open that link in Chrome/Safari and use **Add to Home
   Screen** — the app has a manifest so it opens full-screen like a native app.

Any time you edit files, `git push` again and GitHub Pages updates
automatically within a minute or two.

---

## 4. How each tab works

### Register
- **New QR** generates a brand-new, never-used QR badge on the spot, then
  opens the enrolment form (name, grade, phone, class day, monthly fee).
  Download the badge image to print it (sticker/laminated card) for the
  student.
- **Scan card** reads a QR code that's already printed. If it isn't linked to
  a student yet, the same enrolment form opens, pre-filled with that badge's
  ID — fill it in to register. If it's already registered, the existing
  student's details open for editing (and a **Remove student** option
  appears).

### Student master
Live list of every student, with a search box (name/phone) and grade filter
chips. Tapping a student opens them in the Register tab for editing.

### Mark attendance
Scan a badge to open the student's card. If today matches their class day,
they're marked present immediately. The four tiles show their last four class
occurrences: **green = present**, **red = absent** (no scan recorded once
that date has passed), grey = today/upcoming. Scanning on a day that isn't
their class day just shows their record without marking anything, so it's
safe to double-check a student's history any time.

### Payment
Scan a badge to see every pending month, starting from **August 2026**
(change `PAYMENT_START_MONTH` in `js/utils.js` if your term starts elsewhere).
Tap one or more months to select them, then **Mark as paid** — the amount is
each month's fee (from the student's record) × months selected. Paid months
disappear from the pending list from then on; if a student falls behind,
every unpaid month from August 2026 onward stays listed until it's cleared.

### Reports
This-month and this-week totals, a weekly collections chart (last 8 weeks), a
monthly collections chart (since August 2026), and a grade-wise breakdown for
the current month. The search box at the bottom pulls up any student's full
payment history with amounts per month.

---

## 5. Data model

```
students/{studentId}
  name, grade, phone, classDay, fee, regDate

attendance/{studentId}_{YYYY-MM-DD}
  studentId, date, status: "present", markedAt

payments/{studentId}_{YYYY-MM}
  studentId, month, amount, paidDate
```

`{studentId}` is the same string encoded in that student's QR code (prefixed
with `TUITIONREG::` so the scanner can tell your badges apart from unrelated
QR codes). Attendance only stores *present* records — an absent tile is
simply the absence of a record for a class date that has already passed, so
there's nothing to clean up if a student who missed a week later gets marked
present retroactively.

---

## 6. Customising

- **Grade list** — edit the `GRADES` array in `js/utils.js`.
- **Payment start month** — edit `PAYMENT_START_MONTH` in `js/utils.js`.
- **Colours / fonts** — all design tokens are CSS custom properties at the
  top of `css/style.css`.
- **Multiple class branches** — if you run more than one physical location,
  add a `branch` field to the registration form and filter by it the same way
  grade filtering works on the Student master tab.
