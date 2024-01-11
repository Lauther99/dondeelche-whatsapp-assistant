import { log } from "firebase-functions/logger";
import * as type from "../../types";

export const isNotification = async (
  body: type.WhatsAppMessage,
): Promise<boolean> => {
  try {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (!change.value.messages) {
          // no message its a notification
          log("Notification received, skipping");
          return true;
        }
      }
    }
  } catch (error) {
    log("isNotification failed", error);
    return false;
  }
  return false;
};
