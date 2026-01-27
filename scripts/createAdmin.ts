/**
 * Script to create admin user
 * Run this script manually in Firebase Console or via Firebase Admin SDK
 * 
 * To create the admin user:
 * 1. Go to Firebase Console > Authentication
 * 2. Add user with email: subhisuper@gmail.com
 * 3. Set a password
 * 4. Then run this script or manually create the user document in Firestore
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as serviceAccount from "../firebase-service-account.json";

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app);

async function createAdminUser() {
  try {
    // First, you need to create the user in Firebase Auth manually
    // Then get their UID and use it here
    
    const adminEmail = "subhisuper@gmail.com";
    const adminRole = "fair_director"; // or "website_manager"
    
    // You'll need to get the UID from Firebase Auth after creating the user
    // For now, this is a template
    const adminUid = "REPLACE_WITH_ACTUAL_UID";
    
    await db.collection("users").doc(adminUid).set({
      email: adminEmail,
      role: adminRole,
      createdAt: new Date(),
      profileComplete: true,
      emailVerified: true,
    });
    
    console.log(`Admin user created: ${adminEmail} with role ${adminRole}`);
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Uncomment to run:
// createAdminUser();
