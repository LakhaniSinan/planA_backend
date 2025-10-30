import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";
import fs from "fs";

let serviceAccount;

if (process.env.FIREBASE_CONFIG) {
  // ✅ USE RAW JSON DIRECTLY (NO BASE64 DECODE)
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
} else {
  // ✅ LOCAL DEV fallback
  serviceAccount = JSON.parse(
    fs.readFileSync("./firebase-service-account.json", "utf8")
  );
}

// ✅ Initialize only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
export { serviceAccount };
