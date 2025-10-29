import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";
console.log(process.env.FIREBASE_CONFIG,"process.env.FIREBASE_CONFIGprocess.env.FIREBASE_CONFIG");

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
