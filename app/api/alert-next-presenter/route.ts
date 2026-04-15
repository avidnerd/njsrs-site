import { NextRequest, NextResponse } from "next/server";
import * as sgMail from "@sendgrid/mail";

const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

export async function POST(request: NextRequest) {
  if (!sendGridApiKey) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const { studentName, studentEmail, projectId, projectTitle, categoryName, room } = await request.json();

  if (!studentName || !studentEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const locationLine = room ? `Room ${room}` : categoryName;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#f59e0b;padding:28px 36px;text-align:center;">
            <p style="margin:0;color:#78350f;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">New Jersey Science Research Symposium</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:800;">You're Up Next!</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">
              Hi <strong>${studentName}</strong>,
            </p>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Your presentation is coming up <strong>very soon</strong>. Please make your way to <strong>${locationLine}</strong> now and get ready to present.
            </p>

            <!-- Highlight box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:2px solid #f59e0b;border-radius:10px;margin:0 0 28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;color:#92400e;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Your Presentation</p>
                  ${projectId ? `<p style="margin:0 0 6px;color:#92400e;font-size:13px;font-weight:600;">${projectId}</p>` : ""}
                  <p style="margin:0 0 12px;color:#1c1917;font-size:18px;font-weight:700;">${projectTitle || "Your project"}</p>
                  <p style="margin:0;color:#78350f;font-size:14px;"><strong>Location:</strong> ${locationLine}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#374151;font-size:14px;">
              Please ensure your presentation is ready and your slideshow is loaded before you begin. You will have <strong>10 minutes</strong> to present.
            </p>
            <p style="margin:0;color:#6b7280;font-size:13px;">
              Good luck — the NJSRS team is rooting for you!
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">New Jersey Science Research Symposium &bull; <a href="https://njsrs.org" style="color:#6366f1;text-decoration:none;">njsrs.org</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();

  try {
    await sgMail.send({
      to: studentEmail,
      from: "faircommittee@njsrs.org",
      subject: `You're up next — ${projectId ? projectId + " · " : ""}${locationLine}`,
      html,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending next-presenter alert:", error?.response?.body ?? error);
    return NextResponse.json(
      { error: error?.response?.body ? JSON.stringify(error.response.body) : error.message ?? "Failed to send alert" },
      { status: 500 }
    );
  }
}
