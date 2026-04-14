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

export async function POST(request: NextRequest) {
  const services = getAdminServices();
  if (!services) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }
  const { db, auth } = services;

  try {
    const body = await request.json();
    const { adminIdToken, firstName, lastName, email, password, categoryId, categoryName } = body as {
      adminIdToken: string;
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      categoryId: string;
      categoryName: string;
    };

    if (!adminIdToken || !firstName || !lastName || !email || !password || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify caller is admin
    const decoded = await auth.verifyIdToken(adminIdToken);
    const callerDoc = await db.collection("users").doc(decoded.uid).get();
    const callerRole = callerDoc.data()?.role;
    if (callerRole !== "fair_director" && callerRole !== "website_manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create Firebase Auth account — pre-verified, no email needed
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: true,
    });

    const uid = userRecord.uid;
    const now = admin.firestore.Timestamp.now();

    // users doc (role = proctor, pre-verified)
    await db.collection("users").doc(uid).set({
      email,
      role: "proctor",
      createdAt: now,
      profileComplete: true,
      emailVerified: true,
    });

    // proctors doc
    await db.collection("proctors").doc(uid).set({
      firstName,
      lastName,
      email,
      categoryId,
      categoryName,
      createdAt: now,
    });

    return NextResponse.json({ success: true, uid });
  } catch (error: any) {
    console.error("Error creating proctor:", error);
    return NextResponse.json({ error: error.message || "Failed to create proctor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const services = getAdminServices();
  if (!services) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }
  const { db, auth } = services;

  try {
    const body = await request.json();
    const { adminIdToken, uid } = body as { adminIdToken: string; uid: string };

    if (!adminIdToken || !uid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const decoded = await auth.verifyIdToken(adminIdToken);
    const callerDoc = await db.collection("users").doc(decoded.uid).get();
    const callerRole = callerDoc.data()?.role;
    if (callerRole !== "fair_director" && callerRole !== "website_manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await auth.deleteUser(uid);
    await db.collection("users").doc(uid).delete();
    await db.collection("proctors").doc(uid).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting proctor:", error);
    return NextResponse.json({ error: error.message || "Failed to delete proctor" }, { status: 500 });
  }
}
