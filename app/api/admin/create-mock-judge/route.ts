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

const MOCK_EMAIL = "mockjudge@test.njsrs.org";
const MOCK_PASSWORD = "MockJudge123!";

export async function POST(request: NextRequest) {
  const services = getAdminServices();
  if (!services) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }
  const { db, auth } = services;

  try {
    const body = await request.json();
    const { adminIdToken } = body as { adminIdToken: string };

    if (!adminIdToken) {
      return NextResponse.json({ error: "adminIdToken is required" }, { status: 400 });
    }

    // Verify caller is admin
    const decoded = await auth.verifyIdToken(adminIdToken);
    const callerDoc = await db.collection("users").doc(decoded.uid).get();
    const callerRole = callerDoc.data()?.role;
    if (callerRole !== "fair_director" && callerRole !== "website_manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete existing mock judge account if it exists
    try {
      const existing = await auth.getUserByEmail(MOCK_EMAIL);
      await auth.deleteUser(existing.uid);
      try { await db.collection("users").doc(existing.uid).delete(); } catch {}
      try { await db.collection("judges").doc(existing.uid).delete(); } catch {}
    } catch {
      // No existing account — that's fine
    }

    // Create Firebase Auth account
    const userRecord = await auth.createUser({
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
      displayName: "Mock Judge",
      emailVerified: true,
    });

    const uid = userRecord.uid;
    const now = admin.firestore.Timestamp.now();

    // Create users doc
    await db.collection("users").doc(uid).set({
      email: MOCK_EMAIL,
      role: "judge",
      createdAt: now,
      emailVerified: true,
    });

    // Create judges doc — pre-approved, available all day in person
    await db.collection("judges").doc(uid).set({
      firstName: "Mock",
      lastName: "Judge",
      email: MOCK_EMAIL,
      institution: "Test Institution",
      areaOfExpertise: "General Science",
      availabilityApril18: "in_person_full_day",
      adminApproved: true,
      categoryIds: [],
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      uid,
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
    });
  } catch (error: any) {
    console.error("Error creating mock judge:", error);
    return NextResponse.json({ error: error.message || "Failed to create mock judge" }, { status: 500 });
  }
}
