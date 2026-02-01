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

    // Validate email address
    if (!userData.email || typeof userData.email !== "string") {
      console.error(`Invalid email address for user ${userId}: ${userData.email}`);
      return null;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      console.error(`Invalid email format for user ${userId}: ${userData.email}`);
      return null;
    }

    try {
      // Get user details from their role-specific collection
      // Use a retry mechanism in case the document doesn't exist yet
      let userName = "";
      let userDetails: any = null;
      let attempts = 0;
      const maxAttempts = 3;
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      while (attempts < maxAttempts) {
        if (userData.role === "sra") {
          const sraDoc = await admin.firestore().collection("sras").doc(userId).get();
          if (sraDoc.exists) {
            userDetails = sraDoc.data();
            userName = `${userDetails?.firstName || ""} ${userDetails?.lastName || ""}`.trim();
            break;
          }
        } else if (userData.role === "student") {
          const studentDoc = await admin.firestore().collection("students").doc(userId).get();
          if (studentDoc.exists) {
            userDetails = studentDoc.data();
            userName = `${userDetails?.firstName || ""} ${userDetails?.lastName || ""}`.trim();
            break;
          }
        } else if (userData.role === "judge") {
          const judgeDoc = await admin.firestore().collection("judges").doc(userId).get();
          if (judgeDoc.exists) {
            userDetails = judgeDoc.data();
            userName = `${userDetails?.firstName || ""} ${userDetails?.lastName || ""}`.trim();
            break;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          await delay(1000 * attempts); // Wait 1s, 2s, 3s between attempts
        }
      }

      if (attempts === maxAttempts && !userName) {
        console.warn(`Role-specific document not found for user ${userId} after ${maxAttempts} attempts, proceeding with generic name`);
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

      console.log(`✓ Verification email sent successfully to ${userData.email} for user ${userId}`);
      return null;
    } catch (error: any) {
      // Enhanced error logging
      console.error(`✗ Error sending verification email to ${userData.email} for user ${userId}:`, error);
      
      if (error.response) {
        console.error("SendGrid API error response:", JSON.stringify(error.response.body, null, 2));
        
        // Log specific SendGrid error codes
        if (error.response.body && Array.isArray(error.response.body.errors)) {
          error.response.body.errors.forEach((err: any) => {
            console.error(`SendGrid error: ${err.message} (field: ${err.field}, help: ${err.help || 'N/A'})`);
          });
        }
      } else if (error.message) {
        console.error("Error message:", error.message);
      }

      // Store error in user document for debugging (optional)
      try {
        await admin.firestore().collection("users").doc(userId).update({
          emailError: error.message || "Unknown error",
          emailErrorAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        console.error("Failed to update user document with error:", updateError);
      }

      return null;
    }
  });
