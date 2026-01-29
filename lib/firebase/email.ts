export async function sendVerificationEmail(
  email: string,
  verificationCode: string,
  name: string
): Promise<void> {
  console.log(`Verification code for ${email}: ${verificationCode}`);
}
