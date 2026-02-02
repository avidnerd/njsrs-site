import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";

const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

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

    const { sraId, schoolName, chaperoneName, chaperoneEmail } = await request.json();

    if (!sraId || !schoolName || !chaperoneName || !chaperoneEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(chaperoneEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const token = `${sraId}_chaperone_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const sraDoc = await admin.firestore().collection("sras").doc(sraId).get();
    if (!sraDoc.exists) {
      return NextResponse.json(
        { error: "SRA not found" },
        { status: 404 }
      );
    }

    const sraData = sraDoc.data()!;
    const currentChaperone = sraData.chaperone || {};

    await admin.firestore().collection("sras").doc(sraId).update({
      chaperone: {
        ...currentChaperone,
        name: chaperoneName,
        email: chaperoneEmail,
        inviteToken: token,
        inviteSent: true,
      },
    });

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!baseUrl) {
      if (process.env.VERCEL_ENV === 'production') {
        baseUrl = 'https://njsrs.org';
      } else if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = 'http://localhost:3000';
      }
    }

    const confirmationLink = `${baseUrl}/chaperone-confirm/${token}`;

    const emailSubject = `NJSRS Chaperone Confirmation Request - ${schoolName}`;
    const emailHtml = `
      <h2>Chaperone Confirmation Request</h2>
      <p>Dear ${chaperoneName},</p>
      <p>You have been designated as the chaperone for <strong>${schoolName}</strong> at the New Jersey Science Research Symposium (NJSRS).</p>
      <p>As the chaperone, you will be responsible for supervising all students from ${schoolName} during the event.</p>
      <p>Please click the link below to confirm that you will serve as the chaperone and supervise all students from this school:</p>
      <p><a href="${confirmationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Confirm Chaperone Role</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${confirmationLink}</p>
      <p><strong>Important:</strong> This link is unique and will expire after use. Please confirm your role as soon as possible.</p>
      <p>If you did not expect this email or cannot serve as the chaperone, please contact the Science Research Advisor for ${schoolName}.</p>
      <p>Best regards,<br>The NJSRS Team</p>
    `;

    await sgMail.send({
      to: chaperoneEmail,
      from: "faircommittee@njsrs.org",
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending chaperone invitation email:", error);
    
    let errorMessage = "Failed to send invitation email";
    if (error.response) {
      console.error("SendGrid API error response:", error.response.body);
      errorMessage = `SendGrid API error: ${JSON.stringify(error.response.body)}`;
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
