cook is making me do this so i just put it here
# NJSRS Website Admin & Operations Manual

This manual covers two things:
1. How an admin (roles `fair_director` / `website_manager`) manages the fair through the web dashboard.
2. How to run, configure, and deploy the website and its backend services.

## 0) Roles and what “admin” means in this app

Admin access is controlled by the user role stored in Firestore under `users/{uid}.role`.

Valid admin roles:
- `fair_director`
- `website_manager`

When a user signs in, the app loads their profile document from `users/{uid}` and routes them to the correct dashboard. The Admin Dashboard is behind role checks in `components/auth/ProtectedRoute.tsx`.

Operational implication:
- Admin actions are performed via the web dashboard (`/dashboard/admin`), not via direct database edits.
- Firestore security rules also allow admin read/write for key collections (see `firestore.rules`).

## 1) Create or onboard an admin user

### 1.1 Create the Firebase Auth user (email/password lives here)

1. Open Firebase Console -> Authentication.
2. Create a user for the admin email.
3. Set/confirm the admin password (passwords are managed by Firebase Auth, not stored in this repo).

Important:
- Do not place admin passwords in this repository.
- Password changes should be done via Firebase Auth (or by using the Firebase password reset flow for that admin account if you have re-enabled it).

### 1.2 Add the admin role in Firestore

1. Go to Firestore -> `users` collection.
2. Create/update document: `users/{uid}` where `{uid}` is the Firebase Auth UID for the admin user.
3. Set at minimum:
   - `email`: the admin email
   - `role`: either `fair_director` or `website_manager`
   - `createdAt`: a timestamp/date
   - `profileComplete`: `true`
   - `emailVerified`: `true` (not strictly required for admins in `ProtectedRoute`, but it keeps behavior consistent)

### 1.3 Optional: seed script for admin role

There is a seeding script at `scripts/createAdmin.ts`.

It uses the Firebase Admin SDK with a local service account JSON:
- It imports `../firebase-service-account.json`

You will need to create that file locally (do NOT commit it to git).

The script includes placeholders you must update:
- `adminEmail`
- `adminUid` (replace `REPLACE_WITH_ACTUAL_UID`)
- `adminRole` (defaults to `fair_director`)

## 2) Admin dashboard workflow (day-to-day tasks)

Admin landing page:
- `/dashboard/admin`

Top-level tabs inside the dashboard:
- Science Research Advisors (`AdminSRAList`)
- Judges (`AdminJudgeList`)
- SRC Approval Requests (`AdminSRCApproval`)
- All Students (`AdminStudentList`)
- Categories (`AdminCategories`)

### 2.1 Approve Science Research Advisors (SRAs)

Go to:
- `/dashboard/admin` -> tab “Science Research Advisors”

What you can do:
- View pending SRA applications (filtered by `adminApproved` and `emailVerified`)
- Approve an SRA

What happens on approval:
- The app updates `sras/{sraId}.adminApproved` via `updateSRAApproval` in `lib/firebase/database.ts`.
- Backend trigger sends an approval email (`firebase/functions/src/triggers/sraApproved.ts`).

Steps:
1. Click “View Details” if you need to review the application.
2. Click “Approve” for the SRA.
3. Refresh the list to confirm status shows “APPROVED”.

### 2.2 Approve Judges

Go to:
- `/dashboard/admin` -> tab “Judges”

What you can do:
- Review judge applications
- Approve a judge (sets `judges/{judgeId}.adminApproved`)
- Assign categories to judges (category assignment is stored in `judges/{judgeId}.categoryIds`)

What happens on approval:
- The app updates `judges/{judgeId}.adminApproved` via `updateJudgeApproval`.
- Backend trigger sends an approval email (`firebase/functions/src/triggers/judgeApproved.ts`).

Steps:
1. Use “View Details” to review the application content.
2. In the modal, assign one or more categories by checking the boxes.
3. Click “Approve Judge”.
4. Confirm the status becomes “APPROVED” in the list.

### 2.3 Review SRC Approval Requests

Go to:
- `/dashboard/admin` -> tab “SRC Approval Requests”

What you can do:
- Approve or reject student SRC requests

Where the request lives:
- Students with `students/{studentId}.srcApprovalRequested == true` appear in this screen.

Backend action:
- Approval is handled by `updateSRCApproval` in `lib/firebase/database.ts`, which sets:
  - `srcApproved` (boolean)
  - `srcApprovedAt` timestamp
  - `srcApprovedBy` and optional `srcNotes`

Steps:
1. Click “Review”.
2. Approve/Reject using the UI in the modal.
3. Optionally add notes (if the modal supports it in your UI build).
4. Confirm the request’s status updates in the list.

### 2.4 Manage Categories

Go to:
- `/dashboard/admin` -> tab “Categories”

What you can do:
- Create new categories (stored in `categories` collection)
- Delete categories

Effects of deletion (important):
- A category deletion keeps student/judge records referencing that category until reassigned (the UI warns about this).

Steps:
1. Add categories with a clear, human-readable name.
2. Only delete categories when you are sure you want them removed.

### 2.5 Assign categories and export projects (All Students)

Go to:
- `/dashboard/admin` -> tab “All Students”

What you can do:
- Search students
- Export a CSV of project classifications (uses client-side generation)
- Assign `categoryId` to a student (dropdown on the “Student Details” modal)
- Review submitted materials status (PDF/document presence) from the student record

Notes:
- “Export Project Classifications” generates a CSV in your browser.
- This CSV includes project classification fields based on:
  - `student.primaryScientificDomain`
  - `student.experimentalMethodology`
  - `student.primaryRealWorldFocus`
  - and the currently assigned `categoryId`

Steps:
1. Export when you are ready to distribute judging assignments.
2. For any student that needs reassignment, open “View Details” and update “Category Assignment”.

## 3) Running the website (local development)

Prerequisites:
- Node.js 20+
- Firebase CLI installed

### 3.1 Install dependencies

From the repo root (`njsrs-site`):
- `npm install`

### 3.2 Configure environment variables (required)

The Next.js app uses the following environment variables (see `lib/firebase/config.ts`):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_APP_URL` (recommended; used for some email links)

Email delivery also requires:
- `SENDGRID_API_KEY`

Placeholders (fill in your real values via your local environment manager):
- `NEXT_PUBLIC_*` values: <PUT_YOUR_FIREBASE_CLIENT_VALUES_HERE>
- `NEXT_PUBLIC_APP_URL`: <PUT_YOUR_PUBLIC_SITE_URL_HERE> (example: `https://njsrs.org`)
- `SENDGRID_API_KEY`: <PUT_YOUR_SENDGRID_API_KEY_HERE>

Security note:
- Never commit `.env` files.

### 3.3 Start Next.js locally

- `npm run dev`

Open your browser to the displayed local URL.

## 4) Hosting on Vercel (frontend + Next API routes)

You confirmed this project is hosted on Vercel.

That means:
- Next.js pages and UI are deployed by Vercel.
- Route handlers under `app/api/*` run as Vercel serverless functions.
- Firebase Functions (`firebase/functions`) are deployed separately via Firebase CLI.

### 4.1 Vercel project settings

In Vercel Project Settings:
1. Framework preset: Next.js.
2. Root Directory: repo root (`njsrs-site`).
3. Build command: `npm run build` (default is fine).
4. Install command: `npm install` (default is fine).

### 4.2 Vercel environment variables

Set these in Vercel for each environment you use (Production, Preview, Development as needed):

Required Firebase client variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Required app URL:
- `NEXT_PUBLIC_APP_URL` = your canonical production URL (example: `https://njsrs.org`)

Required email key for Next API routes:
- `SENDGRID_API_KEY`

Why this matters:
- `app/api/change-email/route.ts`
- `app/api/resend-verification/route.ts`
- `app/api/send-chaperone-invitation/route.ts`
- `app/api/send-photo-release-invitation/route.ts`
- `app/api/send-statement-invitation/route.ts`

all use `process.env.SENDGRID_API_KEY` and will fail if it is missing in Vercel.

### 4.3 Vercel deployment routine

Typical production process:
1. Push to your connected Git branch.
2. Let Vercel build/deploy.
3. Open the deployment logs and confirm no env variable errors.
4. Validate:
   - `/login` loads
   - admin sign-in works
   - `/dashboard/admin` loads for admin accounts
   - one email-sending flow works (e.g., resend verification or a form invitation)

### 4.4 Domain + auth consistency checks

1. In Vercel, make sure your production domain is correctly assigned.
2. Set `NEXT_PUBLIC_APP_URL` to that exact canonical domain (prefer non-duplicated host style, e.g., only one of `njsrs.org` vs `www.njsrs.org` unless both are intentionally used).
3. In Firebase Authentication -> Settings -> Authorized domains, include your live host(s).

This prevents invalid or confusing auth/email links.

## 5) Running / deploying backend (Firebase Functions + rules)

The backend lives under `firebase/functions`.

### 5.1 Install and deploy functions

From the repo root, typical flow:
1. Build TypeScript (functions):
   - `npm --prefix firebase/functions run build`
2. Deploy functions:
   - `firebase deploy --only functions`

The functions deployment is configured in `firebase.json`, and will run predeploy steps:
- `npm --prefix "$RESOURCE_DIR" run lint`
- `npm --prefix "$RESOURCE_DIR" run build`

### 5.2 Set SendGrid API key for functions

Email sending in functions uses:
- `functions.config().sendgrid?.api_key`
- or `process.env.SENDGRID_API_KEY` (depending on your environment)

Recommended approach:
- Configure via Firebase runtime config:
  - `firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY" --project YOUR_FIREBASE_PROJECT_ID`

Alternative:
- Set `SENDGRID_API_KEY` in your functions environment variables (if your deployment pipeline provides it).

### 5.3 Deploy Firestore rules

Deploy rules (and indexes) when you change authorization logic:
- `firebase deploy --only firestore:rules,firestore:indexes`

This repo contains:
- `firestore.rules`
- `firestore.indexes.json` referenced in `firebase.json`

## 6) “Where are the passwords?” (security checklist)

Passwords in this system are handled in these places:

1. Admin/user passwords:
   - Stored and validated by Firebase Authentication.
   - Not stored in Firestore or in this repo.
   - Operationally: manage via Firebase Console -> Authentication.

2. Service credentials / API secrets:
   - `SENDGRID_API_KEY`:
     - Used in:
       - `firebase/functions/src/emailService.ts`
       - and Next API routes in `app/api/*` that send invitations/notifications
     - Stored in:
       - Firebase Functions config (`sendgrid.api_key`) and/or environment variables

3. Firebase Admin SDK service account:
   - Used by scripts like `scripts/createAdmin.ts`.
   - Expected local file:
     - `firebase-service-account.json` at the repo root (imported via `../firebase-service-account.json`)
   - This file should be:
     - kept private locally
     - excluded from git

Template fields you can copy into your own runbook notes:
- Admin Firebase user email: <ADMIN_EMAIL_1>
- Admin Firebase user UID: <ADMIN_UID_1>
- Admin role: <fair_director|website_manager>
- Admin password: stored in Firebase Auth (manage via Firebase Console / reset links)
- SendGrid API key: <SENDGRID_API_KEY>
- Public site URL: <NEXT_PUBLIC_APP_URL>
- Firebase client config fields (NEXT_PUBLIC_FIREBASE_*): stored in your hosting provider environment settings

## 7) Troubleshooting (common issues)

Issue: Admin cannot see the Admin Dashboard
- Check `users/{uid}.role` is exactly `fair_director` or `website_manager`.
- If the role is missing or typo’d, the ProtectedRoute will redirect.

Issue: Invitations/notifications fail to send
- Check `SENDGRID_API_KEY` is set for:
  - Firebase Functions (`firebase/functions/src/emailService.ts`)
  - and/or Next API routes (e.g. `app/api/send-*` routes)

Issue: Approval emails redirect to strange pages or prompt for “verify human”
- Ensure `NEXT_PUBLIC_APP_URL` is the real, canonical site domain.
- Ensure Firebase Authentication “Authorized domains” includes the host for your app (so Firebase password reset / email links generate correct continue URLs).

## 8) Deployment checklist (before/after events)

Before the fair:
1. Verify `NEXT_PUBLIC_APP_URL` matches the final live domain.
2. Verify Firestore rules are deployed.
3. Verify Firebase Functions are deployed (and email triggers work).
4. Test email sending (e.g. approve a test SRA/judge).
5. Confirm categories exist and are named correctly.

During the fair:
1. Approve SRA and judges as registrations come in.
2. Review SRC approval requests promptly.
3. Assign categories to judges before the judging schedule.
4. Export and distribute the CSV classification list when needed.

