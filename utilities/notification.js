import admin, { serviceAccount } from "./firebaseConfig.js";
import { google } from "googleapis";
import axios from "axios";

const fcmUrl = "https://fcm.googleapis.com/v1/projects/plan-a-9c87a/messages:send";
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

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
      if (err) return reject(err);
      resolve(tokens.access_token);
    });
  });
}

export const sendNotification = async (payload) => {
  if (!payload?.token || !payload?.title || !payload?.body) {
    return { success: false, error: "Invalid payload" };
  }

  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      fcmUrl,
      {
        message: {
          token: payload.token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data || {},
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, data: response.data };

  } catch (error) {
    return { success: false, error: error?.response?.data || error.message };
  }
};
