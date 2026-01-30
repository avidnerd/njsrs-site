import * as functions from "firebase-functions";
import { sendEmail } from "../emailService";

export const onJudgeApproved = functions.firestore
  .document("judges/{judgeId}")
  // eslint-disable-next-line no-unused-vars
  .onUpdate(async (change, _context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if adminApproved changed from false/undefined to true
    if (!before.adminApproved && after.adminApproved) {
      try {
        await sendEmail({
          to: after.email,
          subject: "NJSRS Judge Application Approved",
          html: `
            <h2>Your Judge Application Has Been Approved!</h2>
            <p>Dear ${after.firstName} ${after.lastName},</p>
            <p>Great news! Your judge application has been reviewed and approved by the Fair Director.</p>
            <p>You can now access your judge dashboard. Additional information about judging assignments will be sent closer to the event date.</p>
            <p><a href="https://your-domain.com/dashboard/judge" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Access Your Dashboard</a></p>
            <p>Thank you for your commitment to the New Jersey Science Research Symposium!</p>
            <p>Best regards,<br>The NJSRS Team</p>
          `,
        });
        console.log(`Approval email sent to Judge: ${after.email}`);
      } catch (error: any) {
        console.error("Error sending judge approval email:", error);
      }
    }
  });
