import * as sgMail from "@sendgrid/mail";
import * as functions from "firebase-functions";

// Initialize SendGrid - try config first (v1), then environment variable (v2)
const sendGridApiKey = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
} else {
  console.warn("SendGrid API key not found in config or environment variables");
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!sendGridApiKey) {
    console.warn("SENDGRID_API_KEY not set, email not sent:", options);
    return;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: options.from || "faircommittee@njsrs.org",
      subject: options.subject,
      html: options.html,
    });
    console.log(`Email sent to ${options.to}`);
  } catch (error: any) {
    console.error("Error sending email:", error);
    if (error.response) {
      console.error("SendGrid error response:", error.response.body);
    }
    throw error;
  }
}
