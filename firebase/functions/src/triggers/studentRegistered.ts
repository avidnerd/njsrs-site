import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendEmail } from "../emailService";

export const onStudentRegistered = functions.firestore
  .document("students/{studentId}")
  .onCreate(async (snap, context) => {
    const studentData = snap.data();

    const sraId = studentData.sraId;
    if (!sraId) {
      console.error("Student registered without SRA ID");
      return null;
    }

    try {
      const sraDoc = await admin.firestore().collection("sras").doc(sraId).get();
      if (!sraDoc.exists) {
        console.error("SRA not found:", sraId);
        return null;
      }

      const sraData = sraDoc.data();
      const sraEmail = sraData?.email;

      if (!sraEmail) {
        console.error("SRA email not found");
        return null;
      }

      const dashboardLink = `${process.env.APP_URL || "https://njsrs.org"}/dashboard/sra`;

      await sendEmail({
        to: sraEmail,
        subject: "New Student Registration",
        html: `
          <h2>New Student Registration</h2>
          <p>Dear ${sraData.firstName} ${sraData.lastName},</p>
          <p>A new student from ${studentData.schoolName} has registered for the New Jersey Science Research Symposium and selected you as their Science Research Advisor.</p>
          <p><strong>Student Information:</strong></p>
          <ul>
            <li>Name: ${studentData.firstName} ${studentData.lastName}</li>
            <li>Email: ${studentData.email}</li>
            <li>Grade: ${studentData.grade}</li>
            <li>Project Title: ${studentData.projectTitle || "Not provided"}</li>
          </ul>
          <p>Students can access their dashboard after verifying their email. You can view and manage your students in your dashboard.</p>
          <p><a href="${dashboardLink}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a></p>
          <p>Best regards,<br>The NJSRS Team</p>
        `,
      });

      console.log(`Approval email sent to SRA: ${sraEmail}`);
      return null;
    } catch (error: any) {
      console.error("Error sending approval email:", error);
      return null;
    }
  });
