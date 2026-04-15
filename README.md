# NJSRS Website — Admin & Operations Manual

This is the operations manual for the New Jersey Science Research Symposium (NJSRS) website and platform. The system handles participant registration, judging assignments, score collection, and live event tracking. It is built on Next.js 14 with Firebase (Auth, Firestore, Storage) and deployed on Vercel. This can also be used as a content management system for other science fairs :D !

The main roles are to: manage five distinct user roles through a single admin dashboard, collect and aggregate judge scores across category and final rounds, track special award judging, and surface a real-time presenter board during the event. If you have any questions about the website or usage, please feel free to email me at subhi.k.steph@gmail.com

---

## Table of Contents

1. [Roles and Access](#1-roles-and-access)
2. [Pre-Event Setup Sequence](#2-pre-event-setup-sequence)
3. [Admin Dashboard — Tab by Tab](#3-admin-dashboard--tab-by-tab)
4. [Science Research Advisors (SRAs)](#4-science-research-advisors-sras)
5. [Students](#5-students)
6. [Team Projects](#6-team-projects)
7. [Chaperones](#7-chaperones)
8. [Judges](#8-judges)
9. [Scoring System](#9-scoring-system)
10. [Special Awards](#10-special-awards)
11. [Proctors and the Live Monitor](#11-proctors-and-the-live-monitor)
12. [Technical Setup and Deployment](#12-technical-setup-and-deployment)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Roles and Access

The platform has five user roles. Every user has a document in `users/{uid}` in Firestore with a `role` field that controls what they can see.

| Role | Dashboard URL | Created By | Verified How |
|---|---|---|---|
| `fair_director` / `website_manager` | `/dashboard/admin` | Manual (Firestore) | Pre-verified |
| `sra` | `/dashboard/sra` | Self-registration | Email code → admin approval |
| `student` | `/dashboard/student` | Self-registration | Email code |
| `judge` | `/dashboard/judge` | Self-registration | Email code → admin approval |
| `proctor` | `/dashboard/proctor` | Admin creates | Pre-verified, no email step |

**Important:** Proctors and admins skip email verification entirely. SRAs and judges require both email verification *and* admin approval before they have full access. Students only need email verification.

### Creating the first admin account

1. Go to **Firebase Console → Authentication** and create a user with the admin email.
2. Go to **Firestore → `users` collection** and create a document with the ID set to that user's Firebase UID:
   ```
   email: "admin@yourdomain.org"
   role: "fair_director"
   createdAt: (current timestamp)
   profileComplete: true
   emailVerified: true
   ```
3. That user can now log in at `/login` and reach `/dashboard/admin`.

Alternatively, run the seeding script at `scripts/createAdmin.ts` with a local service account JSON (see Section 11).

---

## 2. Pre-Event Setup Sequence

Do these steps in order before opening registration.

1. **Create admin account** (Section 1 above)
2. **Create categories** (Admin → Categories tab)
3. **Add authorized domains** in Firebase Authentication settings (include your live domain, e.g. `njsrs.org`)
4. **Open SRA registration** — SRAs self-register at `/register/sra`
5. **Approve SRAs** as they come in (Admin → SRAs tab)
6. **Open student registration** — Students self-register at `/register/student`, selecting their school. The SRA assignment is done by admin after registration.
7. **Assign students to SRAs** (Admin → Students → View Details → "Sponsor (SRA) Assignment")
8. **Assign students to categories** (Admin → Students → View Details → "Category Assignment")
9. **Assign Project IDs** in bulk (Admin → Students → "Assign Project IDs" button)
10. **Open judge registration** — Judges self-register at `/register/judge`
11. **Approve judges and assign categories** (Admin → Judges)
12. **Assign judges to students** (Admin → Scoring → Category Round tab)
13. **Create proctor accounts** for event day (Admin → Proctors tab)

---

## 3. Admin Dashboard — Tab by Tab

Navigate to `/dashboard/admin`. The dashboard has eight tabs:

| Tab | What it's for |
|---|---|
| SRAs | Review and approve Science Research Advisor applications |
| Judges | Review and approve judges; assign them to categories |
| SRC | Approve or reject Scientific Review Committee requests from students |
| Students | View all students; assign SRA, category, project ID; review materials |
| Categories | Create and delete competition categories |
| Scoring | Assign judges to students; view standings; manage rounds |
| Guests | View all guests registered by students, with ticket status |
| Proctors | Create proctor accounts for event-day use |
| Chaperones | View all chaperones registered by SRAs, grouped by school |

---

## 4. Science Research Advisors (SRAs)

### What SRAs do
An SRA is a teacher or faculty member who registers as the supervising contact for a group of students. Once approved, they can see their students' registration status, submitted materials, and payment status from their dashboard at `/dashboard/sra`.

### Registration flow
1. SRA goes to `/register/sra` and fills out the application.
2. They verify their email with a 6-digit code.
3. The admin sees them in the **SRAs → Pending** filter and clicks "Approve."
4. Approval triggers a confirmation email via SendGrid (see Section 11).

### Admin actions
- **View Details** — opens a modal showing full application info and a list of all students associated with this SRA.
- **Approve** — sets `adminApproved: true` on the SRA document. The SRA can then log in with full dashboard access.

---

## 5. Students

### Registration flow
1. Student goes to `/register/student`.
2. They select their school, fill out personal info, project title, description, and classification fields (scientific domain, methodology, real-world focus).
3. They verify their email with a 6-digit code.
4. The admin then assigns their SRA and category from the Students tab.

### Student dashboard (`/dashboard/student`)
Students upload materials:
- **Research Report** (PDF) — required for judging
- **Abstract**
- **Slideshow** (.pptx)
- **Statement of Outside Assistance (SOA)** — requires co-signatures from the teacher, optionally a mentor and parent
- **Photo Release** — requires parent signature
- **Guest registration** — students add guest names/emails if they want to invite any friends or family; tickets are sent via SendGrid


### Admin actions (Students tab)

**View Details modal:**
- **Sponsor (SRA) Assignment** — dropdown of all SRAs registered at the student's school. Changing it writes `sraId` and `sraName` to the student document immediately.
- **Category Assignment** — dropdown of all categories. Assign before running Assign Project IDs.
- **Submitted Materials** — links to uploaded PDFs and status of SOA/photo release.
- **SRC questions**, **ethics questionnaire**, **SOA responses** — view full text.

**Assign Project IDs** — bulk operation that assigns IDs like `CB1`, `CB2` to all students with a category. Students in the same category are sorted alphabetically by last name. The prefix comes from the first letters of significant words in the category name (e.g., "Computational Biology" → `CB`). Run this once categories and assignments are stable.

**Export Project Classifications** — downloads a CSV with student names, schools, project titles, descriptions, scientific domains, methodology, real-world focus, shirt sizes, category, and project ID. Useful for distributing to judges or printing programs.

### Data structure (key fields on `students/{uid}`)
```
firstName, lastName, email, grade
schoolId, schoolName
sraId, sraName
categoryId
projectId           (e.g. "CB1" — set via Assign Project IDs)
projectTitle, projectDescription
status              ("pending" | "approved" | "rejected")
paymentStatus       ("not_received" | "received")
researchReportUrl   (Firebase Storage URL)
slideshowUrl
abstractUrl
isTeamProject       (boolean)
teamMemberFirstName, teamMemberLastName, teamMemberEmail
statementOfOutsideAssistance  (nested object with signatures + question answers)
photoRelease        (nested object with parent signature)
```

---

## 6. Team Projects

Students can register as a two-person team. The primary student registers normally and checks "This is a team project," then fills in their partner's name and email. There is no separate login for the team member — everything lives on the primary student's account.

### How teams appear in the admin

The **Students tab** shows each team as two rows:
- **Primary row** — the student who registered. Shows a purple **Team — Primary** badge under their name.
- **Member row** — immediately below, with a light purple background and a **Team — Member** badge. Shows the partner's name and email. The school, status, category, and project ID columns show the shared project's values.

Clicking "View Details" or "View Team Details" on either row opens the primary student's detail modal, since all the project data (materials, SRA, category, project ID) lives on the primary record.

### Assigning team projects

Treat the primary student as the canonical record. Assign the SRA, category, and project ID to the primary student — it applies to the whole team. Both names will appear in the export CSV if you add them; otherwise, the primary name is the one on the project record.

### Data fields (on `students/{uid}`)
```
isTeamProject          (boolean)
teamMemberFirstName
teamMemberLastName
teamMemberEmail
```

---

## 7. Chaperones

SRAs can designate a chaperone for their school — typically a parent, guardian, or additional faculty member who will accompany students to the event. The chaperone is specified by the SRA through their dashboard, and the system sends an invitation link for the chaperone to confirm attendance and sign off electronically.

### Admin view (Chaperones tab)

The **Chaperones tab** shows all chaperones grouped by school. For each chaperone you can see:
- The **SRA** they are linked to (name + email)
- Chaperone **name**, **email** (clickable mailto link), and **phone**
- **Invite Sent** badge — whether the invitation email was dispatched
- **Confirmed** badge — whether the chaperone clicked the link and signed
- **Confirmation date** — when they confirmed

Use the search bar to filter by school name, SRA name, or chaperone name/email.

### Data structure (nested inside `sras/{uid}`)

Chaperone info is stored as a `chaperone` sub-object on the SRA document:
```
chaperone.name
chaperone.email
chaperone.phone
chaperone.inviteToken    (used to generate the confirmation URL)
chaperone.inviteSent     (boolean)
chaperone.confirmed      (boolean)
chaperone.confirmationDate
chaperone.signature
```

---

## 8. Judges

### What judges do
Judges score student projects using a 100-point rubric across 10 criteria (Research Problem, Scientific Thought, Creativity, etc.). They are assigned to specific students in specific rounds. They can also rank their students within a group.

### Registration flow
1. Judge goes to `/register/judge` and fills out the application (credentials, area of expertise, availability, conflicts of interest).
2. They verify their email with a 6-digit code.
3. Admin approves them and assigns one or more categories.
4. Approval triggers a confirmation email.

### Admin actions (Judges tab)
- **View Details** — shows full application including conflicts of interest, publications, availability, and a category assignment checklist.
- **Approve Judge** — sets `adminApproved: true`.
- **Category checkboxes** — assigns the judge to one or more categories (`judges/{judgeId}.categoryIds`). This is required before assigning them to specific students in the Scoring tab.

### Judge dashboard (`/dashboard/judge`)
Judges see tabs for:
- **Category Round** — their assigned students for the preliminary round, with research report links and a rubric to fill out
- **Final Round** — if they are assigned as final round judges
- **Special Awards** — if they are assigned to evaluate a special award

The judge dashboard shows a "View Rubric (PDF)" button at the top that links to `/rubric.pdf` in the public folder.

---

## 9. Scoring System

### Rounds

**Category Round**: all judges score students in their assigned categories.

**Final Round**: top students from each category are "promoted" by the admin and re-judged by a final round panel.

**Results**: in order to determine the winners, the students are first ranked by the highest average scores. If there is a tie between two students in the raw score, the student with the higher average rank will be denoted as the winner. if there's a tie after that...rock paper scissors or fight to the death i guess LOL 

### Admin scoring workflow (Scoring tab)

The Scoring tab has sub-tabs:

**Category Round:**
- For each category, shows a matrix of judges × students with checkboxes.
- Checking a box creates a `judgingAssignment` document and makes that student appear on the judge's dashboard.
- Unchecking removes the assignment.
- Results below the matrix show ranked standings (avg score, avg rank, score breakdowns).

**Final Round:**
- Select which students to promote using the "Add to final round" controls.
- Assign final round judges (separate from category judges).
- The trophy icons (🥇🥈🥉) show the current top 3 in the final standings.

**Special Award Results:**
- View scores submitted under the Special Awards system.
- "Clear all special award scores" button resets all special award scoring if needed.

**Testing tools section:**
- "Clear final round scores" — removes all final-round judge score documents (for testing and setup).
- "Clear all special award scores" — same for special awards.

### Rubric (100 points total)

| Criterion | Points |
|---|---|
| Identification of Research Problem | 5 |
| Scientific Thought | 5 |
| Creativity / Originality | 5 |
| Acknowledgements | 5 |
| Research Design | 15 |
| Methods | 15 |
| Results | 15 |
| Discussion & Conclusions | 15 |
| References | 5 |
| Communication | 15 |

Judges enter scores and optionally a rank. The rank is used as a tiebreaker — a judge drags or enters a number (1 = top pick in their group). Scores are saved per judge per student; they can update at any time.

### Data structures

`judgingAssignments/{phase}_{judgeId}_{studentId}`:
```
judgeId, studentId, phase ("category" | "final"), categoryId
```

`judgeScores/{phase}_{judgeId}_{studentId}`:
```
judgeId, studentId, phase, categoryId
rubric: { researchProblem, scientificThought, ... }
totalScore, rank, notes, updatedAt
```

---

## 10. Special Awards

Special awards are defined in `lib/firebase/specialAwards.ts` as a static list. Each award has:
- A name and ID
- Award-specific rubric criteria (different from the main judging rubric)
- A description

### Admin workflow
1. In the Scoring tab → Special Award Results, assign judges to awards using the admin controls.
2. I added an option for the admin to shortlist specific candidates prior to the fair so tha tthe special judges have an easier time narrowing down options for the winner.
3. Judges assigned to a special award see it in the Special Awards tab on their dashboard. Judges can be assignes as both a Category Award Judge and Special Award Judge, but they CANNOT be both a Final round judge AND a Category/Special Award Judge.

### Judge scoring
Judges see each candidate and fill out the award-specific rubric. The highest scorer in each award is recommended for that award.

---

## 11. Proctors and the Live Monitor

### What proctors do
Proctors are event-day staff assigned to a single category. Their resonsibility is to monitor the judge presentations and keep track of timing and category judging. They have two responsibilities:
1. **Mark the current presenter**: when a student begins presenting, the proctor taps "Set as presenter." This updates a `liveStatus` document in Firestore in real time.
2. **Monitor scoring completeness**: the Scoring Status tab shows which judges have and haven't submitted their score for each student, so the proctor can follow up with judges who haven't scored yet and ensure scoring runs smoothly.

### Creating a proctor account (Admin → Proctors tab)
1. Click **+ Create proctor**.
2. Enter: first name, last name, email address, password (at least 6 characters), and category.
3. Click **Create proctor account**.
4. The system creates a Firebase Auth account and a `proctors/{uid}` document. No email verification is required — hand the credentials to the proctor directly.
5. To remove a proctor, click **Delete** on their card.

### Proctor dashboard (`/dashboard/proctor`)

**Presenter control tab:**
- Lists all approved students in the category, sorted by project ID.
- Each card shows the student's project ID, name, project title, and links to their research report, slideshow, and abstract.
- "Set as presenter" updates `liveStatus/{categoryId}` in Firestore and marks that student's card with a "Now presenting" badge.
- "Clear presenter" removes the live status for the category.

**Scoring status tab:**
- Shows a summary banner: "7 of 12 scores submitted — 5 outstanding" (turns green when all scores are in).
- For each student, shows a row of judge chips. Green chip = score submitted. Gray chip = not yet scored.
- Judge names appear on the chips. If no score has been submitted, the chip is gray so the proctor can identify which judge to follow up with.

### Live monitor (`/live`)

There is also a public-facing page so everyone can see which presentations are going on in specific rooms. Anyone can go to `njsrs.org/live` and see which project is currently presenting in each category. Updates in real time via a Firestore `onSnapshot` listener. Each category card shows:
- Category name
- Project ID
- Project title
- Student name

### Data structure

`liveStatus/{categoryId}`:
```
categoryId, categoryName
projectId, projectTitle, studentName
updatedAt
```

`proctors/{uid}`:
```
firstName, lastName, email
categoryId, categoryName
createdAt
```

---

## 12. Technical Setup and Deployment

### Local development

Prerequisites: Node.js 20+, Firebase CLI

```bash
cd njsrs-site
npm install
npm run dev
```

### Environment variables

Required in `.env.local` (local) or Vercel environment settings (production):

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase client config |
| `NEXT_PUBLIC_APP_URL` | Base URL for email links (e.g. `https://njsrs.org`) |
| `SENDGRID_API_KEY` | Email delivery (invitations, approval notifications) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK for server API routes (JSON string) |

`FIREBASE_SERVICE_ACCOUNT` is the JSON content of your Firebase service account key file, stored as a single-line string. It is used by `app/api/create-proctor/route.ts`, `app/api/create-student/route.ts`, and related admin API routes.

Never commit `.env.local` or the service account JSON to git.

### Deploying to Vercel

1. Push to the connected Git branch.
2. Set all environment variables in **Vercel → Project Settings → Environment Variables**.
3. Vercel builds and deploys automatically.
4. After deploy, confirm:
   - `/login` loads
   - Admin sign-in reaches `/dashboard/admin`
   - `/live` loads without errors
   - One email flow works (e.g., resend verification)

### Deploying Firestore rules

Run this whenever you change `firestore.rules` or `firestore.indexes.json`:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Deploying Firebase Functions

Functions live in `firebase/functions` and handle email triggers (SRA approved, judge approved, etc.):

```bash
npm --prefix firebase/functions run build
firebase deploy --only functions
```

Set the SendGrid API key for functions:

```bash
firebase functions:config:set sendgrid.api_key="YOUR_KEY" --project YOUR_PROJECT_ID
```

### Firebase Authentication — authorized domains

In **Firebase Console → Authentication → Settings → Authorized domains**, add every domain that your app runs on (e.g., `njsrs.org`, `www.njsrs.org`, your Vercel preview domain). If a domain is missing, OAuth and email action links will fail with an "unauthorized domain" error.

### Creating an admin via script

`scripts/createAdmin.ts` uses the Firebase Admin SDK. Edit the placeholders in the script, then run:

```bash
npx ts-node scripts/createAdmin.ts
```

Requires `firebase-service-account.json` at the repo root (not committed to git).

---

## 13. Troubleshooting

**Admin cannot reach `/dashboard/admin`**
- Check `users/{uid}.role` in Firestore. It must be exactly `fair_director` or `website_manager` (no typos, no extra spaces).

**"User profile not found" on login**
- The user authenticated with Firebase Auth but their `users/{uid}` Firestore document is missing or has the wrong ID. Create or fix the document in Firestore with the correct UID as the document ID.
- This can also appear briefly during a slow connection — the system retries three times before showing the error. Ask the user to refresh and try again.

**Login is slow**
- The most common cause is a browser with a corrupted IndexedDB cache from a previous version of the site. Ask the user to do a hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows). This clears the cached JS bundle.

**Invitations or approval emails not sending**
- Verify `SENDGRID_API_KEY` is set in Vercel (for Next.js API routes) and via `firebase functions:config:set` (for Firebase Functions triggers).
- Check the Vercel function logs and Firebase Functions logs for error details.

**`/live` page doesn't update in real time**
- The page uses a Firestore `onSnapshot` listener. Check that the `liveStatus` collection exists in Firestore and that the Firestore rules allow public read access (they do by default — `allow read: if true` on `liveStatus`).
- If proctors can't write to `liveStatus`, verify the rules are deployed and the proctor's `users/{uid}.role` is exactly `proctor`.

**Proctor sees "No approved students in your category"**
- The students in that category must have both `categoryId` matching the proctor's assigned category AND `status: "approved"`. Check the Students tab to verify both fields.

**Judge can't see a student on their dashboard**
- A `judgingAssignments` document must exist for that judge × student × phase combination. Create it in the Scoring tab by checking the assignment checkbox.

**Project IDs are duplicated or out of order**
- Re-run "Assign Project IDs" in the Students tab after finalizing all category assignments. The operation is idempotent — it overwrites existing IDs based on the current assignment state.

**SRA sees zero students**
- The students associated with this SRA must have `sraId` matching the SRA's Firebase UID. Go to Students → View Details → Sponsor (SRA) Assignment and verify each student.


