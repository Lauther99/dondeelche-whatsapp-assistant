// import {log} from "firebase-functions/logger";
import * as type from "../../types";

export const filterMessageData = (
  body: type.WhatsAppMessage,
  // body bot number
): type.Props => {
  let botPhoneNumber = "";
  let botPhoneNumberId = "";
  let userPhoneNumber = "";
  let userName = "";
  let localMessage;
  let context;
  let id = "";
  try {
    for (const entry of body.entry) {
      // log("Message entry", entry);
      for (const change of entry.changes) {
        if (!change.value.messages) {
          continue;
        }
        // log("Message change", change);
        for (const message of change.value.messages) {
          // log("Message received", message);

          if (message.context) {
            // log("Message context", message.context);
            context = {
              from: message.context.from,
              id: message.context.id,
            };
          }

          userName = change.value.contacts[0].profile.name;
          userPhoneNumber = message.from;
          botPhoneNumber = change.value.metadata.display_phone_number;
          botPhoneNumberId = change.value.metadata.phone_number_id;
          id = message.id;
          localMessage = message;

          if (
            message.type !== "text" &&
            message.type !== "button" &&
            message.type !== "interactive"
          ) {
            // log(
            //   "Message type not allowed",
            //   message.type,
            //   "for",
            //   userPhoneNumber,
            //   "to",
            //   botPhoneNumber,
            // );
            return {
              messageInfo: {
                content: "not-allowed",
                type: localMessage?.type || "",
                time: localMessage?.timestamp || "",
                role: "user",
                username: userName,
              },
              id,
              userPhoneNumber,
              botPhoneNumber,
              botPhoneNumberId,
            };
          } else {
            // its allowed

            const messageInfo = {
              content: getTextFromMessage(message as any),
              type: message.type,
              time: message.timestamp,
              username: userName,
              role: "user",
            };

            return {
              context,
              messageInfo,
              userPhoneNumber,
              botPhoneNumber,
              botPhoneNumberId,
              id,
            };
          }
        }
      }
    }
  } catch (error) {
    console.log("isAllowedTypeMessage failed", error);
  }
  return {
    messageInfo: {
      // TODO handle this as failed message
      content: "not-allowed",
      type: localMessage?.type || "",
      time: localMessage?.timestamp || "",
      username: userName,
      role: "user",
    },
    id,
    userPhoneNumber,
    botPhoneNumber,
    botPhoneNumberId,
  };
};

const getTextFromMessage = (messages?: {
  text?: {
    body: string;
  };
  button?: {
    text: string;
    payload: string;
  };
  interactive?: {
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
    };
  };
  type: "text" | "button" | "interactive";
}): string => {
  if (messages?.type === "button") {
    return messages.button?.text || "";
  }
  if (messages?.type === "text") {
    return messages.text?.body || "";
  }
  if (messages?.type === "interactive") {
    if (messages.interactive?.button_reply) {
      return messages.interactive?.button_reply.title;
    }
    if (messages.interactive?.list_reply) {
      return messages.interactive?.list_reply.title;
    }
  }
  return "";
};
