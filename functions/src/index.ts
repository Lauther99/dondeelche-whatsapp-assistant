import * as functions from "firebase-functions";
import * as express from "express";
import { BOT_PHONE, FirebaseApp } from "./config";
import * as cors from "cors";
import * as type from "./types/";
import * as WhatsappUtils from "./whatsapp/utils";
import * as Whatsapp from "./whatsapp/whatsapp";

const db = FirebaseApp.firestore();
const app = express();
app.use(cors());

app.post("/send-whatsapp-message", async (req, res) => {
    try {
        const userPhone = req.body.receiver_phone;
        const message = req.body.message_content;

        res.set("Access-Control-Allow-Origin", "*");
        if (req.method === "OPTIONS") {
            // Send res to OPTIONS requests
            res.set("Access-Control-Allow-Methods", ["GET", "POST"]);
            res.set("Access-Control-Allow-Headers", "Content-Type");
            res.set("Access-Control-Max-Age", "3600");
            res.status(204).json({ message: "Ok" });
            return;
        }

        await Whatsapp.sendMessages(db, userPhone, BOT_PHONE, message);
        return res.status(200).json({ message: "Ok" });
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "Error" });
    }
});

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

