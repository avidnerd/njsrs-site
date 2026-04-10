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

const MOCK_PASSWORD = "MockJudge123!";
const COUNT = 20;

function mockEmail(n: number) {
  return `mockjudge${n}@test.njsrs.org`;
}

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

    const now = admin.firestore.Timestamp.now();
    const results: { email: string; password: string }[] = [];
    const failures: { email: string; error: string }[] = [];

    for (let n = 1; n <= COUNT; n++) {
      const email = mockEmail(n);
      try {
        let uid: string;

        // Try to get existing account and update it, otherwise create fresh
        try {
          const existing = await auth.getUserByEmail(email);
          uid = existing.uid;
          await auth.updateUser(uid, {
            password: MOCK_PASSWORD,
            displayName: `Mock Judge ${n}`,
            emailVerified: true,
          });
        } catch {
          // Account doesn't exist — create it
          const userRecord = await auth.createUser({
            email,
            password: MOCK_PASSWORD,
            displayName: `Mock Judge ${n}`,
            emailVerified: true,
          });
          uid = userRecord.uid;
        }

        await db.collection("users").doc(uid).set({
          email,
          role: "judge",
          createdAt: now,
          emailVerified: true,
        });

        await db.collection("judges").doc(uid).set({
          firstName: "Mock",
          lastName: `Judge ${n}`,
          email,
          institution: "Test Institution",
          areaOfExpertise: "General Science",
          availabilityApril18: "in_person_full_day",
          adminApproved: true,
          categoryIds: [],
          createdAt: now,
        });

        results.push({ email, password: MOCK_PASSWORD });
      } catch (err: any) {
        console.error(`Failed to create mock judge ${n}:`, err);
        failures.push({ email, error: err.message || "Unknown error" });
      }
    }

    return NextResponse.json({
      success: true,
      judges: results,
      failures,
      password: MOCK_PASSWORD,
    });
  } catch (error: any) {
    console.error("Error in bulk mock judge creation:", error);
    return NextResponse.json({ error: error.message || "Failed to create mock judges" }, { status: 500 });
  }
}
