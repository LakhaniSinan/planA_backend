import admin from "firebase-admin";
import fs from "fs";

let serviceAccount;
console.log(process.env.GOOGLE_CLIENT_ID,"HERE_U_GO")
if (process.env.FIREBASE_CONFIG) {
  const json = Buffer.from(process.env.FIREBASE_CONFIG, "base64").toString("utf8");
  serviceAccount = JSON.parse(json);
} else {
  serviceAccount = JSON.parse(
    fs.readFileSync("./firebase-service-account.json", "utf8")
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export { serviceAccount };
export default admin;
