import * as path from "path";
import * as fs from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
const altPath = path.join(__dirname, "..", "firebase-service-account.json");
const resolvedPath = fs.existsSync(serviceAccountPath)
  ? serviceAccountPath
  : fs.existsSync(altPath)
    ? altPath
    : null;
if (!resolvedPath) {
  console.error(
    "Missing firebase-service-account.json. Place it in the project root and run this script from the project root."
  );
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));

const app = initializeApp({ credential: cert(serviceAccount as any) });
const db = getFirestore(app);

async function createMissingStudentDocs() {
  const usersSnapshot = await db
    .collection("users")
    .where("role", "==", "student")
    .get();

  if (usersSnapshot.empty) {
    console.log("No users with role 'student' found.");
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();
    const email = userData.email || "";

    const studentRef = db.collection("students").doc(uid);
    const studentSnap = await studentRef.get();
    if (studentSnap.exists) {
      skipped++;
      continue;
    }

    const placeholderStudent = {
      firstName: "Pending",
      lastName: "Sync",
      email,
      schoolId: "",
      schoolName: "(Unknown – add in dashboard)",
      sraId: "",
      sraName: "(Unknown – add in dashboard)",
      grade: "?",
      status: "approved",
      approvedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      paymentStatus: "not_received",
    };

    await studentRef.set(placeholderStudent);
    created++;
    console.log(`Created students/${uid} for ${email}`);
  }

  console.log(`Done. Created ${created} missing student doc(s), skipped ${skipped} (already had a student doc).`);
  console.log("They will now appear under Admin Dashboard → All Students. Update their details there or ask them to re-register.");
}

createMissingStudentDocs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
