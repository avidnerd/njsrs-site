import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

function getDb() {
  if (!admin.apps.length) {
    try {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccount) {
        const serviceAccountJson = JSON.parse(serviceAccount);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountJson),
        });
      }
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error);
    }
  }
  return admin.apps.length ? admin.firestore() : null;
}

export async function POST(request: NextRequest) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { idToken, studentData } = body as {
      idToken: string;
      studentData: Record<string, unknown>;
    };
    if (!idToken || !studentData) {
      return NextResponse.json(
        { error: "idToken and studentData are required" },
        { status: 400 }
      );
    }
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const docData = {
      ...studentData,
      status: "approved",
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentStatus: "not_received",
    };
    await db.collection("students").doc(uid).set(docData);
    return NextResponse.json({ success: true, studentId: uid });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("Error creating student:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create student" },
      { status: 500 }
    );
  }
}
