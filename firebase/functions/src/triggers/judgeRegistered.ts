import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendEmail } from "../emailService";

export const onJudgeRegistered = functions.firestore
  .document("judges/{judgeId}")
  // eslint-disable-next-line no-unused-vars
  .onCreate(async (snap, _context) => {
    const judgeData = snap.data();

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
          subject: "New Judge Registration - Review Required",
          html: `
            <h2>New Judge Registration</h2>
            <p>A new judge has registered and requires admin review:</p>
            <ul>
              <li><strong>Name:</strong> ${judgeData.firstName} ${judgeData.lastName}</li>
              <li><strong>Email:</strong> ${judgeData.email}</li>
              <li><strong>Institution:</strong> ${judgeData.institution || "Not provided"}</li>
              <li><strong>Highest Degree:</strong> ${judgeData.highestDegree || "Not provided"}</li>
              <li><strong>Area of Expertise:</strong> ${judgeData.areaOfExpertise || "Not provided"}</li>
            </ul>
            <p>Please log in to the admin dashboard to review the full application and approve this judge.</p>
            <p>Best regards,<br>The NJSRS System</p>
          `,
        })
      );

      await Promise.all(emailPromises);
      console.log(`Notification emails sent to ${adminEmails.length} admin(s) for new judge: ${judgeData.email}`);
    } catch (error: any) {
      console.error("Error sending admin notification for judge:", error);
    }
  });
