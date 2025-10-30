import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";

let serviceAccount;

if (process.env.FIREBASE_CONFIG) {
  const decoded = Buffer.from(process.env.FIREBASE_CONFIG, "base64").toString("utf8");
  serviceAccount = JSON.parse(decoded);
} else {
  serviceAccount = JSON.parse(
    fs.readFileSync(process.env.FIREBASE_CONFIG_PATH || "./firebase-service-account.json", "utf8")
  );
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
