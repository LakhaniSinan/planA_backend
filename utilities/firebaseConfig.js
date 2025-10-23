import admin from "firebase-admin";
import serviceAccount from "../plan-a-9c87a-firebase-adminsdk-fbsvc-00c4eab8ac.json" with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
