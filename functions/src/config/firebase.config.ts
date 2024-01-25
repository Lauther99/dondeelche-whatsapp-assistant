import * as admin from "firebase-admin"

export const FirebaseApp = admin.initializeApp({
  credential: admin.credential.cert("./credentials.json"),
});
