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

  const { guestName, guestEmail, studentName, studentSchool } = await request.json();

  if (!guestName || !guestEmail || !studentName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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
          <td style="background:#1e3a5f;padding:28px 36px;text-align:center;">
            <p style="margin:0;color:#93c5fd;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">New Jersey Science Research Symposium</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:700;">Guest Pass</h1>
          </td>
        </tr>

        <!-- Ticket body -->
        <tr>
          <td style="padding:32px 36px;">
            <p style="margin:0 0 20px;color:#374151;font-size:15px;">Dear <strong>${guestName}</strong>,</p>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;">
              You have been invited by <strong>${studentName}</strong>${studentSchool ? ` of <strong>${studentSchool}</strong>` : ""} to attend their presentation at the <strong>New Jersey Science Research Symposium (NJSRS)</strong>.
            </p>

            <!-- Ticket card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;border:2px dashed #6366f1;border-radius:10px;margin:0 0 28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 4px;color:#6366f1;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Your Guest Pass</p>
                  <p style="margin:0 0 20px;color:#1e1b4b;font-size:22px;font-weight:700;">${guestName}</p>

                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:0 0 12px;">
                        <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Event</p>
                        <p style="margin:4px 0 0;color:#111827;font-size:14px;font-weight:600;">New Jersey Science Research Symposium 2026</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 12px;">
                        <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Date</p>
                        <p style="margin:4px 0 0;color:#111827;font-size:14px;font-weight:600;">Friday, April 18, 2026</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 0 12px;">
                        <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Location</p>
                        <p style="margin:4px 0 0;color:#111827;font-size:14px;font-weight:600;">Millburn High School</p>
                        <p style="margin:2px 0 0;color:#374151;font-size:13px;">462 Millburn Ave, Millburn, NJ 07041</p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Presenting Student</p>
                        <p style="margin:4px 0 0;color:#111827;font-size:14px;font-weight:600;">${studentName}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#374151;font-size:14px;">
              Please bring this email (printed or on your phone) as your guest pass for entry. Present it at the check-in table upon arrival.
            </p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
              Guests are welcome during the public presentation period. Please follow all venue guidelines and instructions from NJSRS staff.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">New Jersey Science Research Symposium &bull; <a href="https://njsrs.org" style="color:#6366f1;text-decoration:none;">njsrs.org</a></p>
            <p style="margin:6px 0 0;color:#9ca3af;font-size:12px;">Questions? Contact us at <a href="mailto:fairdirector@njsrs.org" style="color:#6366f1;text-decoration:none;">fairdirector@njsrs.org</a></p>
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
      to: guestEmail,
      from: "faircommittee@njsrs.org",
      subject: `Your NJSRS Guest Pass — ${studentName}'s Presentation`,
      html,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending guest ticket:", error?.response?.body ?? error);
    return NextResponse.json(
      { error: error?.response?.body ? JSON.stringify(error.response.body) : error.message ?? "Failed to send ticket" },
      { status: 500 }
    );
  }
}
