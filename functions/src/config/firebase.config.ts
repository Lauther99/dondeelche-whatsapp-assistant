import admin = require("firebase-admin");

export const FirebaseApp = admin.initializeApp({
  credential: admin.credential.cert("./credentials.json"),
});
