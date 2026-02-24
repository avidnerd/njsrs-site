import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as serviceAccount from "../firebase-service-account.json";

const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app);

async function createAdminUser() {
  try {
    const adminEmail = "subhisuper@gmail.com";
    const adminRole = "fair_director";
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
