import { NextRequest, NextResponse } from "next/server";
import * as sgMail from "@sendgrid/mail";


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

    
    
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!baseUrl) {
      
      if (process.env.VERCEL_ENV === 'production') {
        
        baseUrl = 'https:
      } else if (process.env.VERCEL_URL) {
        
        baseUrl = `https:
      } else {
        
        baseUrl = 'http:
      }
    }

    const signerType = type === "teacher" ? "Science Research Advisor" : type === "mentor" ? "Mentor" : "Parent";
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
