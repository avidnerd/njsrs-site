import * as functions from "firebase-functions";
import { sendEmail } from "../emailService";

export const onSRAApproved = functions.firestore
  .document("sras/{sraId}")
  .onUpdate(async (change, _context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before.adminApproved && after.adminApproved) {
      try {
        await sendEmail({
          to: after.email,
          subject: "NJSRS SRA Registration Approved",
          html: `
            <h2>Your SRA Registration Has Been Approved!</h2>
            <p>Dear ${after.firstName} ${after.lastName},</p>
            <p>Great news! Your Science Research Advisor registration has been approved by the Fair Director.</p>
            <p>You can now access your dashboard to manage students from ${after.schoolName}.</p>
            <p>To access your dashboard, log in with your account and click <strong>Dashboard</strong> in the site navigation.</p>
            <p>Best regards,<br>The NJSRS Team</p>
          `,
        });
        console.log(`Approval email sent to SRA: ${after.email}`);
      } catch (error: any) {
        console.error("Error sending SRA approval email:", error);
      }
    }
  });
