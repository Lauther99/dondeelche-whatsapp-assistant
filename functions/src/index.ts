import * as functions from "firebase-functions";
import * as express from "express";
import { FirebaseApp } from "./config";
// import { BOT_PHONE, FirebaseApp } from "./config";
import * as cors from "cors";
import * as type from "./types/";
import * as WhatsappUtils from "./whatsapp/utils";
import * as Whatsapp from "./whatsapp/whatsapp";
// import { BOT_FLOWS } from "./stateMachine/Flows";
import { updateChatStatus } from "./firebase/contactsManager";

const db = FirebaseApp.firestore();
const app = express();
app.use(cors());

// app.post("/send-whatsapp-message", async (req, res) => {
//     try {
//         const userPhone = req.body.receiver_phone;
//         const message = req.body.message_content;

//         res.set("Access-Control-Allow-Origin", "*");
//         if (req.method === "OPTIONS") {
//             // Send res to OPTIONS requests
//             res.set("Access-Control-Allow-Methods", ["GET", "POST"]);
//             res.set("Access-Control-Allow-Headers", "Content-Type");
//             res.set("Access-Control-Max-Age", "3600");
//             res.status(204).json({ message: "Ok" });
//             return;
//         }
//         const WhatsAppMessages = new Whatsapp.WhatsAppMessages(db, userPhone, BOT_PHONE);
//         WhatsAppMessages.setLastFlow(BOT_FLOWS.HUMAN);
//         const waid = await WhatsAppMessages.sendMessagesFromFlutterFlow(message);

//         return res.status(200).json({ message: "Ok", waid: waid });
//     } catch (error) {
//         console.log(error);
//         return res.status(400).json({ message: "Error" });
//     }
// });

app.post("/reboot-chat-status", async (req, res) => {
    try {
        const userPhone = req.body.contact_phone;

        res.set("Access-Control-Allow-Origin", "*");
        if (req.method === "OPTIONS") {
            // Send res to OPTIONS requests
            res.set("Access-Control-Allow-Methods", ["GET", "POST"]);
            res.set("Access-Control-Allow-Headers", "Content-Type");
            res.set("Access-Control-Max-Age", "3600");
            res.status(204).json({ message: "Ok" });
            return;
        }
        await updateChatStatus(db, userPhone);

        return res.status(200).json({ message: "Ok" });
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "Error" });
    }
});

// app.post("/send-whatsapp-document", async (req, res) => {
//     try {
//         const userPhone = req.body.receiver_phone;
//         const link = req.body.message_link;
//         const name = req.body.document_name ?? "Document";

//         res.set("Access-Control-Allow-Origin", "*");
//         if (req.method === "OPTIONS") {
//             // Send res to OPTIONS requests
//             res.set("Access-Control-Allow-Methods", ["GET", "POST"]);
//             res.set("Access-Control-Allow-Headers", "Content-Type");
//             res.set("Access-Control-Max-Age", "3600");
//             res.status(204).json({ message: "Ok" });
//             return;
//         }
//         const WhatsAppMessages = new Whatsapp.WhatsAppInteractive(db, userPhone, BOT_PHONE);
//         WhatsAppMessages.setLastFlow(BOT_FLOWS.HUMAN);
//         const waid = await WhatsAppMessages.sendDocument(link, name, true,{ isReaded: true, chat_status: type.ChatStatus.HUMAN });
//         return res.status(200).json({ message: "Ok", waid: waid });
//     } catch (error) {
//         console.log(error);
//         return res.status(400).json({ message: "Error" });
//     }
// });

app.get("/wsp-webhook", async (req, res) => {
    try {
        res.set("Access-Control-Allow-Origin", "*");
        if (req.method === "OPTIONS") {
            // Send res to OPTIONS requests
            res.set("Access-Control-Allow-Methods", ["GET", "POST"]);
            res.set("Access-Control-Allow-Headers", "Content-Type");
            res.set("Access-Control-Max-Age", "3600");
            res.status(204).send("");
            return;
        }
        console.log("Get endpoint");
        console.log(req.query);
        return res.send(req.query["hub.challenge"]);
    } catch (error) {
        return res.status(400).json({ message: "Error" });
    }
});

app.post("/wsp-webhook", async (req, res) => {
    try {
        res.set("Access-Control-Allow-Origin", "*");
        if (req.method === "OPTIONS") {
            // Send res to OPTIONS requests
            res.set("Access-Control-Allow-Methods", ["GET", "POST"]);
            res.set("Access-Control-Allow-Headers", "Content-Type");
            res.set("Access-Control-Max-Age", "3600");
            res.status(204).send("");
            return;
        }
        const incomingMessage: type.WhatsAppMessage = req.body;
        const isNotif = await WhatsappUtils.isNotification(incomingMessage);
        if (!isNotif) {
            const messageData = WhatsappUtils.filterMessageData(incomingMessage);
            console.log("Incoming Message");
            console.dir(messageData);
            await Whatsapp.chatStateManager(db, messageData);
        }
        return res.status(200).json({ message: "Ok" });
    } catch (error) {
        return res.status(400).json({ message: "Error" });
    }
});

export const whatsappbot = functions.https.onRequest(app);