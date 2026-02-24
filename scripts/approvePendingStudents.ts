import * as path from "path";
import * as fs from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const serviceAccountPath =
  path.join(process.cwd(), "firebase-service-account.json");
const altPath = path.join(__dirname, "..", "firebase-service-account.json");
const resolvedPath = fs.existsSync(serviceAccountPath)
  ? serviceAccountPath
  : fs.existsSync(altPath)
    ? altPath
    : null;
if (!resolvedPath) {
  console.error(
    "Missing firebase-service-account.json. Place it in the project root and run this script from the project root (e.g. npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' scripts/approvePendingStudents.ts)."
  );
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));

const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app);

async function approvePendingStudents() {
  try {
    const snapshot = await db
      .collection("students")
      .where("status", "==", "pending")
      .get();

    if (snapshot.empty) {
      console.log("No pending students found.");
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        status: "approved",
        approvedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`Approved ${snapshot.size} pending student(s). They can now access their dashboard.`);
  } catch (error) {
    console.error("Error approving pending students:", error);
    throw error;
  }
}

approvePendingStudents()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
