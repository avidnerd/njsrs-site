import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

function getAdminServices() {
  if (!admin.apps.length) {
    try {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccount) {
        admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccount)) });
      }
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error);
    }
  }
  if (!admin.apps.length) return null;
  return { db: admin.firestore(), auth: admin.auth() };
}

export async function DELETE(request: NextRequest) {
  const services = getAdminServices();
  if (!services) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }
  const { db, auth } = services;

  try {
    const { adminIdToken, uid } = await request.json() as { adminIdToken: string; uid: string };

    if (!adminIdToken || !uid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const decoded = await auth.verifyIdToken(adminIdToken);
    const callerDoc = await db.collection("users").doc(decoded.uid).get();
    const callerRole = callerDoc.data()?.role;
    if (callerRole !== "fair_director" && callerRole !== "website_manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete Auth account, judge profile, and user profile
    await Promise.allSettled([
      auth.deleteUser(uid),
      db.collection("judges").doc(uid).delete(),
      db.collection("users").doc(uid).delete(),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting judge:", error);
    return NextResponse.json({ error: error.message || "Failed to delete judge" }, { status: 500 });
  }
}
