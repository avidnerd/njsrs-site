import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendEmail } from "../emailService";

export const onUserCreated = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const userId = context.params.userId;

    // Only send verification email if user is not an admin
    if (userData.role === "fair_director" || userData.role === "website_manager") {
      return null;
    }

    if (!userData.verificationCode) {
      return null;
    }

    try {
      // Get user details from their role-specific collection
      let userName = "";
      let userDetails: any = null;

      if (userData.role === "sra") {
        const sraDoc = await admin.firestore().collection("sras").doc(userId).get();
        if (sraDoc.exists) {
          userDetails = sraDoc.data();
          userName = `${userDetails?.firstName || ""} ${userDetails?.lastName || ""}`.trim();
        }
      } else if (userData.role === "student") {
        const studentDoc = await admin.firestore().collection("students").doc(userId).get();
        if (studentDoc.exists) {
          userDetails = studentDoc.data();
          userName = `${userDetails?.firstName || ""} ${userDetails?.lastName || ""}`.trim();
        }
      } else if (userData.role === "judge") {
        const judgeDoc = await admin.firestore().collection("judges").doc(userId).get();
        if (judgeDoc.exists) {
          userDetails = judgeDoc.data();
          userName = `${userDetails?.firstName || ""} ${userDetails?.lastName || ""}`.trim();
        }
      }

      // Send verification email
      await sendEmail({
        to: userData.email,
        subject: "Verify Your NJSRS Account",
        html: `
          <h2>Welcome to NJSRS!</h2>
          <p>Dear ${userName || "User"},</p>
          <p>Thank you for registering with the New Jersey Science Research Symposium.</p>
          <p>Your verification code is: <strong style="font-size: 24px; color: #10b981;">${userData.verificationCode}</strong></p>
          <p>This code will expire in 24 hours.</p>
          <p>Please enter this code on the verification page to complete your registration.</p>
          <p>If you did not register for NJSRS, please ignore this email.</p>
          <p>Best regards,<br>The NJSRS Team</p>
        `,
      });

      console.log(`Verification email sent to ${userData.email}`);
      return null;
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      return null;
    }
  });
