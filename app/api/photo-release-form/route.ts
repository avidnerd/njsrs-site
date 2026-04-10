import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp, Firestore } from "firebase-admin/firestore";

function getDb(): Firestore | null {
  try {
    if (!getApps().length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccount) {
        try {
          const serviceAccountJson = JSON.parse(serviceAccount);
          initializeApp({ credential: cert(serviceAccountJson) });
        } catch {
          initializeApp();
        }
      } else {
        initializeApp();
      }
    }
    return getFirestore();
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }
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
    if (parts.length < 3 || parts[1] !== "photorelease") {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    const studentId = parts[0];
    const isTeamMember = parts[2] === "teammember";

    if (!studentId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    
    const studentDoc = await db.collection("students").doc(studentId).get();

    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();
    const photoRelease = studentData?.photoRelease;

    if (!photoRelease) {
      return NextResponse.json(
        { error: "Photo release form not found" },
        { status: 404 }
      );
    }

    
    const expectedToken = isTeamMember ? photoRelease.teamMemberParentInviteToken : photoRelease.parentInviteToken;
    if (expectedToken !== token) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 403 }
      );
    }

    
    return NextResponse.json({
      student: {
        id: studentId,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        teamMemberFirstName: studentData.teamMemberFirstName,
        teamMemberLastName: studentData.teamMemberLastName,
      },
      formData: photoRelease,
    });
  } catch (error: any) {
    console.error("Error loading photo release form:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load form" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { token, formData } = body;

    if (!token || !formData) {
      return NextResponse.json(
        { error: "Token and formData are required" },
        { status: 400 }
      );
    }

    
    const parts = token.split("_");
    if (parts.length < 3 || parts[1] !== "photorelease") {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    const studentId = parts[0];
    const isTeamMember = parts[2] === "teammember";

    if (!studentId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    
    const studentDoc = await db.collection("students").doc(studentId).get();

    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();
    const currentPhotoRelease = studentData?.photoRelease;

    if (!currentPhotoRelease) {
      return NextResponse.json(
        { error: "Photo release form not found" },
        { status: 404 }
      );
    }

    
    const expectedToken = isTeamMember ? currentPhotoRelease.teamMemberParentInviteToken : currentPhotoRelease.parentInviteToken;
    if (expectedToken !== token) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 403 }
      );
    }

    
    const convertTimestamps = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (Array.isArray(obj)) {
        return obj.map(convertTimestamps);
      }
      if (typeof obj === 'object' && obj.seconds !== undefined && obj.nanoseconds !== undefined && !(obj instanceof Timestamp)) {
        
        return new Timestamp(obj.seconds, obj.nanoseconds);
      }
      if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
        const converted: any = {};
        for (const key in obj) {
          converted[key] = convertTimestamps(obj[key]);
        }
        return converted;
      }
      return obj;
    };

    const convertedFormData = convertTimestamps(formData);

    
    await db.collection("students").doc(studentId).update({
      photoRelease: convertedFormData,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating photo release form:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update form" },
      { status: 500 }
    );
  }
}
