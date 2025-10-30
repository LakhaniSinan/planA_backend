import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";

let serviceAccount;

// If running on HEROKU (using BASE64 config)
if (process.env.FIREBASE_CONFIG) {
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_CONFIG, "base64").toString("utf8")
  );
}
// If running locally (using JSON file)
else {
  serviceAccount = await import("../firebase-service-account.json", {
    assert: { type: "json" },
  }).then((m) => m.default);
}

// Initialize Firebase only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
export { serviceAccount };
