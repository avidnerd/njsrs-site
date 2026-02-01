import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Timestamp, Firestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
let db: Firestore;

try {
  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      try {
        const serviceAccountJson = JSON.parse(serviceAccount);
        initializeApp({
          credential: cert(serviceAccountJson),
        });
      } catch (parseError) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT:", parseError);
        // Try to initialize with default credentials
        initializeApp();
      }
    } else {
      // Fallback to default credentials (works on Vercel with Firebase environment)
      initializeApp();
    }
  }
  db = getFirestore();
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  // This will cause errors later, but at least the app won't crash on import
  db = getFirestore();
}

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

    // Token format: studentId_type_timestamp_random
    const parts = token.split("_");
    if (parts.length < 3) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    const studentId = parts[0];
    const type = parts[1] as "teacher" | "mentor" | "parent";

    if (!studentId || !type || !["teacher", "mentor", "parent"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    // Get student document
    const studentDoc = await db.collection("students").doc(studentId).get();

    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();
    const statement = studentData?.statementOfOutsideAssistance;

    if (!statement) {
      return NextResponse.json(
        { error: "Statement form not found" },
        { status: 404 }
      );
    }

    // Verify token matches
    if (
      (type === "teacher" && statement.teacherInviteToken !== token) ||
      (type === "mentor" && statement.mentorInviteToken !== token) ||
      (type === "parent" && statement.parentInviteToken !== token)
    ) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 403 }
      );
    }

    // Return only the necessary data
    return NextResponse.json({
      student: {
        id: studentId,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
      },
      formData: statement,
      signerType: type,
    });
  } catch (error: any) {
    console.error("Error loading statement form:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load form" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, formData, signerType } = body;

    if (!token || !formData || !signerType) {
      return NextResponse.json(
        { error: "Token, formData, and signerType are required" },
        { status: 400 }
      );
    }

    // Token format: studentId_type_timestamp_random
    const parts = token.split("_");
    if (parts.length < 3) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    const studentId = parts[0];
    const type = parts[1] as "teacher" | "mentor" | "parent";

    if (!studentId || !type || !["teacher", "mentor", "parent"].includes(type) || type !== signerType) {
      return NextResponse.json(
        { error: "Invalid token or signer type mismatch" },
        { status: 400 }
      );
    }

    // Get student document to verify token
    const studentDoc = await db.collection("students").doc(studentId).get();

    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();
    const currentStatement = studentData?.statementOfOutsideAssistance;

    if (!currentStatement) {
      return NextResponse.json(
        { error: "Statement form not found" },
        { status: 404 }
      );
    }

    // Verify token matches
    if (
      (type === "teacher" && currentStatement.teacherInviteToken !== token) ||
      (type === "mentor" && currentStatement.mentorInviteToken !== token) ||
      (type === "parent" && currentStatement.parentInviteToken !== token)
    ) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 403 }
      );
    }

    // Update the student document with the new form data
    await db.collection("students").doc(studentId).update({
      statementOfOutsideAssistance: formData,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating statement form:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update form" },
      { status: 500 }
    );
  }
}
