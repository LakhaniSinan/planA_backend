import admin from "./firebaseConfig.js";
import { google } from "googleapis";
import axios from "axios";
import serviceAccount from "../plan-a-9c87a-firebase-adminsdk-fbsvc-2d7611d41e.json" with { type: "json" };

const fcmUrl = "https://fcm.googleapis.com/v1/projects/plan-a-9c87a/messages:send";

const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

async function getAccessToken() {
  return new Promise((resolve, reject) => {
    // Make sure the private key newlines are formatted correctly
    const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");
    console.log(privateKey, serviceAccount.client_email, "privateKeyprivateKeyprivateKey");

    const jwtClient = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      privateKey,
      SCOPES,
      null
    );

    jwtClient.authorize((err, tokens) => {
      if (err) {
        console.error("Error authorizing JWT:", err);
        reject(err);
        return;
      }
      console.log("✅ Token generated successfully");
      resolve(tokens.access_token);
    });
  });
}

export const sendNotification = async (payload) => {
  console.log(payload, "payloadpayloadpayloadpayload");
  try {
    const token = await getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const params = {
      title: payload.title,
      body: payload.body
    }
    console.log(payload, params, "paramsparamsparams");

    const response = await axios.post(payload.token, params, { headers });
    console.log("✅ Notification sent successfully:", response.data);
  } catch (error) {
    console.error("❌ Error sending notification:", error?.response?.data || error);
  }
};
