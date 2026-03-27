import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

function getAdminServices() {
  if (!admin.apps.length) {
    try {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccount) {
        const serviceAccountJson = JSON.parse(serviceAccount);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccountJson) });
      }
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error);
    }
  }
  if (!admin.apps.length) return null;
  return { db: admin.firestore(), auth: admin.auth() };
}

// DELETE /api/admin/reset-student
// Body: { adminIdToken: string, email: string }
// Deletes the Firebase Auth account + Firestore users doc so the student can re-register.
export async function POST(request: NextRequest) {
  const services = getAdminServices();
  if (!services) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }
  const { db, auth } = services;

  try {
    const body = await request.json();
    const { adminIdToken, email } = body as { adminIdToken: string; email: string };

    if (!adminIdToken || !email) {
      return NextResponse.json({ error: "adminIdToken and email are required" }, { status: 400 });
    }

    // Verify the caller is an admin
    const decoded = await auth.verifyIdToken(adminIdToken);
    const callerDoc = await db.collection("users").doc(decoded.uid).get();
    const callerRole = callerDoc.data()?.role;
    if (callerRole !== "fair_director" && callerRole !== "website_manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Look up the user by email
    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch {
      return NextResponse.json({ error: `No Firebase Auth account found for ${email}` }, { status: 404 });
    }

    const uid = userRecord.uid;

    // Delete Firestore documents (best-effort — student doc may not exist)
    try { await db.collection("students").doc(uid).delete(); } catch {}
    try { await db.collection("users").doc(uid).delete(); } catch {}

    // Delete the Firebase Auth account
    await auth.deleteUser(uid);

    return NextResponse.json({ success: true, message: `Account for ${email} deleted. They can now re-register.` });
  } catch (error: any) {
    console.error("Error resetting student:", error);
    return NextResponse.json({ error: error.message || "Failed to reset student" }, { status: 500 });
  }
}
