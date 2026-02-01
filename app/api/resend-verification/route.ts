import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";

// Initialize SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

// Initialize Firebase Admin if not already initialized
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

export async function POST(request: NextRequest) {
  try {
    if (!sendGridApiKey) {
      console.error("SENDGRID_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Get user data from Firestore
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;

    // Don't resend if already verified
    if (userData.emailVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 24);

    // Update user document with new code
    await admin.firestore().collection("users").doc(userId).update({
      verificationCode,
      verificationCodeExpiry: admin.firestore.Timestamp.fromDate(verificationCodeExpiry),
    });

    // Get user details from their role-specific collection
    let userName = "";
    let userDetails: any = null;

    if (userData.role === "sra") {
      const sraDoc = await admin.firestore().collection("sras").doc(userId).get();
      if (sraDoc.exists) {
        userDetails = sraDoc.data();
        userName = `${userDetails?.firstName || ""} ${userDetails?.lastName || ""}`.trim();
      }
    } else if (userData.role === "student") {
      const studentDoc = await admin.firestore().collection("students").doc(userId).get();
      if (studentDoc.exists) {
        userDetails = studentDoc.data();
        userName = `${userDetails?.firstName || ""} ${userDetails?.lastName || ""}`.trim();
      }
    } else if (userData.role === "judge") {
      const judgeDoc = await admin.firestore().collection("judges").doc(userId).get();
      if (judgeDoc.exists) {
        userDetails = judgeDoc.data();
        userName = `${userDetails?.firstName || ""} ${userDetails?.lastName || ""}`.trim();
      }
    }

    // Send verification email
    await sgMail.send({
      to: userData.email,
      from: "faircommittee@njsrs.org",
      subject: "Verify Your NJSRS Account",
      html: `
        <h2>Welcome to NJSRS!</h2>
        <p>Dear ${userName || "User"},</p>
        <p>Thank you for registering with the New Jersey Science Research Symposium.</p>
        <p>Your verification code is: <strong style="font-size: 24px; color: #10b981;">${verificationCode}</strong></p>
        <p>This code will expire in 24 hours.</p>
        <p>Please enter this code on the verification page to complete your registration.</p>
        <p>If you did not register for NJSRS, please ignore this email.</p>
        <p>Best regards,<br>The NJSRS Team</p>
      `,
    });

    return NextResponse.json({ success: true, message: "Verification email sent" });
  } catch (error: any) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
