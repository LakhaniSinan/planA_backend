import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";
import fs from "fs";

let serviceAccount;

if (process.env.FIREBASE_CONFIG) {
  const decoded = Buffer.from(process.env.FIREBASE_CONFIG, "base64").toString("utf8");
  serviceAccount = JSON.parse(decoded);
} else {
  const filePath = process.env.FIREBASE_CONFIG_PATH || "./firebase-service-account.json";

  if (!fs.existsSync(filePath)) {
    console.error("❌ Service account file not found:", filePath);
    throw new Error("Service account JSON missing locally.");
  }

  serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf8"));
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export { serviceAccount };
export default admin;
