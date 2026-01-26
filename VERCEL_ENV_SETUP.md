# Vercel Environment Variables Setup

## Required Environment Variables

You need to add these **6 environment variables** to Vercel:

1. `NEXT_PUBLIC_FIREBASE_API_KEY`
2. `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
4. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
5. `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
6. `NEXT_PUBLIC_FIREBASE_APP_ID`

## How to Get These Values from Firebase

### Step 1: Go to Firebase Console
1. Visit https://console.firebase.google.com/
2. Select your project (or create a new one)

### Step 2: Get Your Firebase Config
1. Click the **gear icon** (⚙️) next to "Project Overview" in the left sidebar
2. Select **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. If you don't have a web app yet:
   - Click **"</>" (Web icon)** to add a web app
   - Register your app (give it a nickname like "NJSRS Website")
   - Click "Register app"
5. You'll see your Firebase configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### Step 3: Map Firebase Config to Environment Variables

Copy each value to the corresponding Vercel environment variable:

| Firebase Config Key | Vercel Environment Variable Name | Example Value |
|-------------------|----------------------------------|---------------|
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project-id.firebaseapp.com` |
| `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` |
| `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project-id.appspot.com` |
| `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123456789012:web:abcdef1234567890` |

## How to Add Environment Variables to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project (or import it if you haven't)
3. Click on **"Settings"** tab
4. Click on **"Environment Variables"** in the left sidebar
5. For each variable:
   - Click **"Add New"**
   - Enter the **Name** (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - Enter the **Value** (paste from Firebase config)
   - Select **Environment(s)**: Check all three (Production, Preview, Development)
   - Click **"Save"**
6. Repeat for all 6 variables

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login
vercel login

# Add each environment variable
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID

# When prompted, select all environments (Production, Preview, Development)
# Paste the value when prompted
```

## After Adding Variables

1. **Redeploy your project** in Vercel:
   - Go to your project → "Deployments" tab
   - Click the "..." menu on the latest deployment
   - Select "Redeploy"
   - OR push a new commit to trigger a new deployment

2. **Verify it's working**:
   - Visit your deployed site
   - Try to register/login
   - Check browser console for any Firebase errors

## Important Notes

- All variables start with `NEXT_PUBLIC_` which makes them available in the browser
- Make sure to add them to **all environments** (Production, Preview, Development)
- After adding variables, you need to redeploy for them to take effect
- These values are safe to expose in the browser (Firebase handles security via rules)
