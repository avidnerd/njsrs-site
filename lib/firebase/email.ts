// Client-side email sending via Cloud Function
// Note: Actual email sending happens in Cloud Functions

export async function sendVerificationEmail(
  email: string,
  verificationCode: string,
  name: string
): Promise<void> {
  // This will be called from Cloud Function trigger
  // For now, we'll just log it - the actual email is sent by Cloud Function
  console.log(`Verification code for ${email}: ${verificationCode}`);
}
