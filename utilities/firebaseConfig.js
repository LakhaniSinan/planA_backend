var admin = require("firebase-admin");

var serviceAccount = require("../plan-a-9c87a-firebase-adminsdk-fbsvc-00c4eab8ac.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = {
    admin,
};
