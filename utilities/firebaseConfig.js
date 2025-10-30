import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";
import fs from "fs"; // <-- ADD THIS

let serviceAccount;

if (process.env.FIREBASE_CONFIG) {
  // Decode Base64 JSON (Heroku)
  const decoded = Buffer.from(process.env.FIREBASE_CONFIG, "base64").toString("utf8");
  serviceAccount = JSON.parse(decoded);
} else {
  // Local development fallback
  serviceAccount = JSON.parse(
    fs.readFileSync(process.env.FIREBASE_CONFIG_PATH || "./firebase-service-account.json", "utf8")
  );
}

// Avoid re-initialization when using nodemon or Next.js hot reload
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
