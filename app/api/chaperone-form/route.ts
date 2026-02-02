import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

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

const db = admin.firestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const parts = token.split("_");
    if (parts.length < 3) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    const sraId = parts[0];

    const sraDoc = await db.collection("sras").doc(sraId).get();

    if (!sraDoc.exists) {
      return NextResponse.json(
        { error: "SRA not found" },
        { status: 404 }
      );
    }

    const sraData = sraDoc.data()!;
    const chaperone = sraData.chaperone;

    if (!chaperone || chaperone.inviteToken !== token) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      sraId,
      schoolName: sraData.schoolName,
      chaperoneName: chaperone.name,
      chaperoneEmail: chaperone.email,
      confirmed: chaperone.confirmed || false,
    });
  } catch (error: any) {
    console.error("Error loading chaperone form:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load form" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, signature } = body;

    if (!token || !signature) {
      return NextResponse.json(
        { error: "Token and signature are required" },
        { status: 400 }
      );
    }

    const parts = token.split("_");
    if (parts.length < 3) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    const sraId = parts[0];

    const sraDoc = await db.collection("sras").doc(sraId).get();

    if (!sraDoc.exists) {
      return NextResponse.json(
        { error: "SRA not found" },
        { status: 404 }
      );
    }

    const sraData = sraDoc.data()!;
    const currentChaperone = sraData.chaperone;

    if (!currentChaperone || currentChaperone.inviteToken !== token) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 403 }
      );
    }

    if (currentChaperone.confirmed) {
      return NextResponse.json(
        { error: "Chaperone already confirmed" },
        { status: 400 }
      );
    }

    await db.collection("sras").doc(sraId).update({
      chaperone: {
        ...currentChaperone,
        confirmed: true,
        confirmationDate: admin.firestore.Timestamp.now(),
        signature: signature.trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error submitting chaperone confirmation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit confirmation" },
      { status: 500 }
    );
  }
}
