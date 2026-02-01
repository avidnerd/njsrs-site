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
    const errorMsg = "SENDGRID_API_KEY not set, email not sent";
    console.error(errorMsg, { to: options.to, subject: options.subject });
    throw new Error(errorMsg);
  }

  // Validate email address
  if (!options.to || typeof options.to !== "string") {
    throw new Error(`Invalid recipient email: ${options.to}`);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(options.to)) {
    throw new Error(`Invalid email format: ${options.to}`);
  }

  try {
    const result = await sgMail.send({
      to: options.to,
      from: options.from || "faircommittee@njsrs.org",
      subject: options.subject,
      html: options.html,
    });
    
    console.log(`✓ Email sent successfully to ${options.to}`, {
      statusCode: result[0]?.statusCode,
      headers: result[0]?.headers,
    });
  } catch (error: any) {
    console.error(`✗ Error sending email to ${options.to}:`, error);
    
    if (error.response) {
      const errorBody = error.response.body;
      console.error("SendGrid API error response:", JSON.stringify(errorBody, null, 2));
      
      // Log specific error details
      if (errorBody && Array.isArray(errorBody.errors)) {
        errorBody.errors.forEach((err: any) => {
          console.error(`SendGrid error detail:`, {
            message: err.message,
            field: err.field,
            help: err.help,
          });
        });
      }
    } else if (error.message) {
      console.error("Error message:", error.message);
    }
    
    throw error;
  }
}
