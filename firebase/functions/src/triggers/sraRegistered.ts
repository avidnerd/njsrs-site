import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendEmail } from "../emailService";

export const onSRARegistered = functions.firestore
  .document("sras/{sraId}")
  // eslint-disable-next-line no-unused-vars
  .onCreate(async (snap, _context) => {
    const sraData = snap.data();

    try {
      // Get all admins
      const adminsSnapshot = await admin.firestore()
        .collection("users")
        .where("role", "in", ["fair_director", "website_manager"])
        .get();

      const adminEmails = adminsSnapshot.docs.map((doc) => doc.data().email);

      // Send email to all admins
      const emailPromises = adminEmails.map((adminEmail) =>
        sendEmail({
          to: adminEmail,
          subject: "New SRA Registration - Approval Required",
          html: `
            <h2>New Science Research Advisor Registration</h2>
            <p>A new SRA has registered and requires admin approval:</p>
            <ul>
              <li><strong>Name:</strong> ${sraData.firstName} ${sraData.lastName}</li>
              <li><strong>Email:</strong> ${sraData.email}</li>
              <li><strong>School:</strong> ${sraData.schoolName}</li>
              <li><strong>Phone:</strong> ${sraData.phone || "Not provided"}</li>
              <li><strong>Title:</strong> ${sraData.title || "Not provided"}</li>
            </ul>
            <p>Please log in to the admin dashboard to review and approve this SRA.</p>
            <p>Best regards,<br>The NJSRS System</p>
          `,
        })
      );

      await Promise.all(emailPromises);
      console.log(`Notification emails sent to ${adminEmails.length} admin(s) for new SRA: ${sraData.email}`);
    } catch (error: any) {
      console.error("Error sending admin notification for SRA:", error);
    }
  });
