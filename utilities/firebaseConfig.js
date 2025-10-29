// utilities/firebaseConfig.js
import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";

if (!process.env.FIREBASE_CONFIG) {
  throw new Error("FIREBASE_CONFIG is not defined in environment variables");
}

// 1. Safely parse Firebase config
let firebaseConfig;
try {
  // Replace literal '\n' with actual newlines for the private key
  const parsed = JSON.parse(
    process.env.FIREBASE_CONFIG.replace(/\\n/g, "\n")
  );
  firebaseConfig = parsed;
} catch (err) {
  console.error("Failed to parse FIREBASE_CONFIG:", err.message);
  throw err;
}

// 2. Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

export default admin;
