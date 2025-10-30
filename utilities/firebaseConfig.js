import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";

let serviceAccount;

if (process.env.FIREBASE_CONFIG) {
  const decoded = Buffer.from(process.env.FIREBASE_CONFIG, "base64").toString("utf8");
  serviceAccount = JSON.parse(decoded);
} else {
  throw new Error("FIREBASE_CONFIG env var missing");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export { serviceAccount };
export default admin;
