import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";
import fs from "fs";

let firebaseConfig;
  console.log(process.env.FIREBASE_CONFIG,"process.env.FIREBASE_CONFIG");
  
if (process.env.FIREBASE_CONFIG) {
  // Heroku production
  firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
} else {
  // Local dev
  const path = process.env.FIREBASE_CONFIG_PATH || './firebase-service-account.json';
  firebaseConfig = JSON.parse(fs.readFileSync(path, 'utf-8'));
}

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

export default admin;
