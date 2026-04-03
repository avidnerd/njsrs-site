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

const MOCK_EMAIL = "mockstudent@test.njsrs.org";
const MOCK_PASSWORD = "MockStudent123!";

export async function POST(request: NextRequest) {
  const services = getAdminServices();
  if (!services) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }
  const { db, auth } = services;

  try {
    const { adminIdToken } = (await request.json()) as { adminIdToken: string };
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

    // Delete existing mock student if present
    try {
      const existing = await auth.getUserByEmail(MOCK_EMAIL);
      await auth.deleteUser(existing.uid);
      try { await db.collection("users").doc(existing.uid).delete(); } catch {}
      try { await db.collection("students").doc(existing.uid).delete(); } catch {}
    } catch {
      // No existing account — fine
    }

    // Create Firebase Auth account
    const userRecord = await auth.createUser({
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
      displayName: "Mock Student",
      emailVerified: true,
    });

    const uid = userRecord.uid;
    const now = admin.firestore.Timestamp.now();

    // users doc
    await db.collection("users").doc(uid).set({
      email: MOCK_EMAIL,
      role: "student",
      createdAt: now,
      emailVerified: true,
    });

    // students doc — pre-approved, with a placeholder project
    await db.collection("students").doc(uid).set({
      firstName: "Mock",
      lastName: "Student",
      email: MOCK_EMAIL,
      schoolId: "mock-school",
      schoolName: "Mock High School",
      sraId: "mock-sra",
      sraName: "Mock SRA",
      grade: "11",
      projectTitle: "Mock Research Project: Testing the Judging System",
      projectDescription: "This is a placeholder project created for testing purposes.",
      primaryScientificDomain: ["Computer Science"],
      status: "approved",
      paymentStatus: "received",
      createdAt: now,
      approvedAt: now,
    });

    return NextResponse.json({ success: true, uid, email: MOCK_EMAIL, password: MOCK_PASSWORD });
  } catch (error: any) {
    console.error("Error creating mock student:", error);
    return NextResponse.json({ error: error.message || "Failed to create mock student" }, { status: 500 });
  }
}
