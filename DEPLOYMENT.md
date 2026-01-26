# Deployment Guide for NJSRS Website

## Prerequisites

1. Firebase account: https://console.firebase.google.com/
2. Vercel account (recommended): https://vercel.com/ (or use Firebase Hosting)

## Step 1: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or select existing)
3. Enable the following services:
   - **Authentication** → Enable Email/Password provider
   - **Firestore Database** → Create database (start in test mode, we'll deploy rules)
   - **Storage** → Enable
   - **Cloud Functions** → Enable (requires Blaze plan)

4. Get your Firebase config:
   - Go to Project Settings → Your apps → Web app
   - Copy the Firebase configuration object

## Step 2: Create Environment Variables File

Create `.env.local` in the root directory:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 3: Set Up SendGrid for Email (Optional but Recommended)

1. Create account at https://sendgrid.com/
2. Get API key from SendGrid dashboard
3. Set it for Cloud Functions:
   ```bash
   firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
   ```

## Step 4: Deploy to Vercel (Recommended)

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts, then add environment variables in Vercel dashboard
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/
2. Import your Git repository (or drag & drop)
3. Add environment variables in project settings
4. Deploy!

## Step 5: Deploy Firebase Services

```bash
# Login to Firebase
firebase login

# Set your project
firebase use your-project-id

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# Deploy Cloud Functions
cd firebase/functions
npm install
cd ../..
firebase deploy --only functions
```

## Step 6: Update Firebase Project ID

Update `.firebaserc` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## Troubleshooting

- If build fails, check environment variables are set correctly
- Make sure Firebase project has all services enabled
- Cloud Functions require Firebase Blaze plan (pay-as-you-go)
