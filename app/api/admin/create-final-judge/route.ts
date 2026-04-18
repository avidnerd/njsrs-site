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

export async function POST(request: NextRequest) {
  const services = getAdminServices();
  if (!services) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }
  const { db, auth } = services;

  try {
    const body = await request.json();
    const { adminIdToken, firstName, lastName, email, password } = body as {
      adminIdToken: string;
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    };

    if (!adminIdToken || !firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "adminIdToken, firstName, lastName, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const decoded = await auth.verifyIdToken(adminIdToken);
    const callerDoc = await db.collection("users").doc(decoded.uid).get();
    const callerRole = callerDoc.data()?.role;
    if (callerRole !== "fair_director" && callerRole !== "website_manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const existing = await auth.getUserByEmail(normalizedEmail);
      await auth.deleteUser(existing.uid);
      try { await db.collection("users").doc(existing.uid).delete(); } catch {}
      try { await db.collection("judges").doc(existing.uid).delete(); } catch {}
    } catch {}

    const userRecord = await auth.createUser({
      email: normalizedEmail,
      password,
      displayName: `${firstName.trim()} ${lastName.trim()}`,
      emailVerified: true,
    });

    const uid = userRecord.uid;
    const now = admin.firestore.Timestamp.now();

    await db.collection("users").doc(uid).set({
      email: normalizedEmail,
      role: "judge",
      createdAt: now,
      emailVerified: true,
    });

    await db.collection("judges").doc(uid).set({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      availabilityApril18: "in_person_full_day",
      adminApproved: true,
      finalRoundJudge: true,
      categoryIds: [],
      createdAt: now,
    });

    return NextResponse.json({ success: true, uid, email: normalizedEmail, password });
  } catch (error: any) {
    console.error("Error creating final judge:", error);
    return NextResponse.json({ error: error.message || "Failed to create judge account" }, { status: 500 });
  }
}
