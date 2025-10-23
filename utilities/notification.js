const { admin } = require("./firebaseConfig");
const { google } = require("googleapis");
const axios = require("axios");

const fcmUrl =
  "https://fcm.googleapis.com/v1/projects/residentjob-4da34/messages:send";

const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

async function getAccessToken() {
  return new Promise(function (resolve, reject) {
    const key = require("../plan-a-9c87a-firebase-adminsdk-fbsvc-00c4eab8ac.json");
    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      SCOPES,
      null
    );
    jwtClient.authorize(function (err, tokens) {
      console.log(tokens, "TOKEN");
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
}

const sendNotification = async (payload) => {
  console.log(payload, "payloadpayloadpayloadpayload");

  try {
    let token = await getAccessToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(fcmUrl, payload, { headers });
    console.log("Notification sent successfully:", response.data);
  } catch (error) {
    console.log(error, "errorerrorerror");
    console.error("Error sending notification:", error?.response);
  }
};

module.exports = {
  sendNotification,
};
