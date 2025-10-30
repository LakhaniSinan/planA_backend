import dotenv from "dotenv";
dotenv.config();
import admin from "./firebaseConfig.js";
import { google } from "googleapis";
import axios from "axios";
import fs from "fs";

let serviceAccount;

// If running on Heroku (FIREBASE_CONFIG is set)
if (process.env.FIREBASE_CONFIG) {
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
} else {
  // Local environment
  const path = process.env.FIREBASE_CONFIG_PATH || "./firebase-service-account.json";
  serviceAccount = JSON.parse(fs.readFileSync(path, "utf-8"));
}

const fcmUrl = "https://fcm.googleapis.com/v1/projects/plan-a-9c87a/messages:send";
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

async function getAccessToken() {
  return new Promise((resolve, reject) => {
    // Ensure private key formatting
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
    throw error;
  }
};
