import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Email service
import { sendEmail } from "./emailService";
import { onStudentRegistered } from "./triggers/studentRegistered";
import { onSRARegistered } from "./triggers/sraRegistered";
import { onJudgeRegistered } from "./triggers/judgeRegistered";
import { onUserCreated } from "./triggers/sendVerificationEmail";
import { onSRAApproved } from "./triggers/sraApproved";
import { onJudgeApproved } from "./triggers/judgeApproved";

// Export Cloud Functions
export { onStudentRegistered, onSRARegistered, onJudgeRegistered, onUserCreated, onSRAApproved, onJudgeApproved };

// HTTP function for SRA approval
export const approveStudent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const { studentId, approved } = data;
  const sraId = context.auth.uid;

  try {
    // Verify SRA owns this student
    const studentDoc = await admin.firestore().collection("students").doc(studentId).get();
    if (!studentDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Student not found");
    }

    const studentData = studentDoc.data();
    if (studentData?.sraId !== sraId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You can only approve your own students"
      );
    }

    // Update student status
    await admin.firestore().collection("students").doc(studentId).update({
      status: approved ? "approved" : "rejected",
      approvedAt: approved ? admin.firestore.FieldValue.serverTimestamp() : null,
    });

    // Send confirmation email to student
    if (approved && studentData?.email) {
      await sendEmail({
        to: studentData.email,
        subject: "NJSRS Registration Approved",
        html: `
          <h2>Your registration has been approved!</h2>
          <p>Dear ${studentData.firstName},</p>
          <p>Your Science Research Advisor has approved your registration for the New Jersey Science Research Symposium.</p>
          <p>You can now log in to your dashboard to upload your research plan and abstract.</p>
          <p>Best regards,<br>The NJSRS Team</p>
        `,
      });
    }

    return { success: true };
  } catch (error: any) {
    throw new functions.https.HttpsError(
      "internal",
      error.message || "An error occurred"
    );
  }
});
