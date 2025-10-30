// notification.js
import dotenv from "dotenv";
dotenv.config();
import admin from "./firebaseConfig.js";
import { google } from "googleapis";
import axios from "axios";

const fcmUrl = "https://fcm.googleapis.com/v1/projects/plan-a-9c87a/messages:send";
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

// Decode service account from Base64 env (Heroku) OR fall back to admin's credential
let serviceAccount;
if (process.env.FIREBASE_CONFIG) {
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_CONFIG, "base64").toString("utf8")
  );
} else {
  // Local development: use admin credential JSON loaded in firebaseConfig.js
  // admin.credential.cert().toJSON() may not always be available depending on how you initialized admin,
  // so try to get it safely:
  try {
    serviceAccount = admin?.credential?.cert()?.toJSON?.() || null;
  } catch (e) {
    serviceAccount = null;
  }
  if (!serviceAccount) {
    console.error("Local service account not found. Make sure FIREBASE_CONFIG_PATH or local JSON is present.");
    throw new Error("Service account not found");
  }
}

async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");

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
      resolve(tokens.access_token);
    });
  });
}

export const sendNotification = async (payload) => {
  if (!payload?.token || !payload?.title || !payload?.body) {
    console.error("Invalid notification payload");
    return { success: false, error: "Invalid payload" };
  }

  try {
    const accessToken = await getAccessToken();
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const messagePayload = {
      message: {
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
      },
    };

    const response = await axios.post(fcmUrl, messagePayload, { headers });
    return { success: true, data: response.data };
  } catch (error) {
    const errorData = error?.response?.data?.error;
    const errorCode = errorData?.details?.[0]?.errorCode;
    const errorMessage = errorData?.message || error.message;

    if (errorCode === "UNREGISTERED" || errorCode === "INVALID_ARGUMENT") {
      return { success: false, error: "Token unregistered", code: errorCode };
    }

    console.error("Error sending notification:", errorMessage);
    return { success: false, error: errorMessage };
  }
};
