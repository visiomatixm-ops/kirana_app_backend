import admin from "firebase-admin";
import serviceAccount from "./kirana-billing-app-96ac5-firebase-adminsdk-fbsvc-9f2138579f.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      serviceAccount as admin.ServiceAccount
    ),
  });
}

export default admin;