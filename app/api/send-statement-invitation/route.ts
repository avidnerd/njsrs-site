import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid - use the same environment variable as Firebase Functions
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
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

    const { studentId, studentName, type, email, token } = await request.json();

    if (!studentId || !studentName || !type || !email || !token) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const signerType = type === "teacher" ? "Teacher" : type === "mentor" ? "Mentor" : "Parent";
    const invitationLink = `${baseUrl}/statement-sign/${token}`;

    const emailSubject = `NJSRS Statement of Outside Assistance - ${signerType} Signature Required`;
    const emailHtml = `
      <h2>Statement of Outside Assistance - Signature Required</h2>
      <p>Dear ${signerType},</p>
      <p>${studentName} has requested your signature on their Statement of Outside Assistance form for the New Jersey Science Research Symposium (NJSRS).</p>
      <p>Please click the link below to complete your section of the form and provide your electronic signature:</p>
      <p><a href="${invitationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Complete Form & Sign</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${invitationLink}</p>
      <p><strong>Important:</strong> This link is unique and will expire after use. Please complete the form as soon as possible.</p>
      <p>If you did not expect this email, please ignore it.</p>
      <p>Best regards,<br>The NJSRS Team</p>
    `;

    await sgMail.send({
      to: email,
      from: "faircommittee@njsrs.org",
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return NextResponse.json(
      { error: "Failed to send invitation email" },
      { status: 500 }
    );
  }
}
