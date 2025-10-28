import admin from "firebase-admin";
import serviceAccount from "../plan-a-9c87a-firebase-adminsdk-fbsvc-2d7611d41e.json" with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
