import { isAxiosError } from "axios";
import { AxiosWhatsapp } from "./axios/axiosWhatsapp";
import { log } from "firebase-functions/logger";
import * as Firestore from "firebase-admin/firestore";
import { findContactByUserPhone, saveToChat } from "../firebase/contactsManager";
import * as type from "../types";
import { MainFlow } from "../stateMachine/MainFlow";
import { BOT_FLOWS } from "../stateMachine/Flows";

// const getstateFromMessage = (
//     message: string,
// ): string => {
//     const states: { [key: string]: string } = {
//         "Carta del menú": BOT_FLOWS.FOODMENU,
//         "Quiero hacer mi pedido": BOT_FLOWS.HUMAN,
//     };
//     return states[message] || "DEFAULT";
// };

export const chatStateManager = async (
    db: Firestore.Firestore,
    messageData: type.Props,) => {
    // const selectedStatus = getstateFromMessage(messageData.messageInfo.content);
    if (messageData.messageInfo.type === "text") {
        const currentContact = await findContactByUserPhone(db, messageData.userPhoneNumber);
        const currentStatus = currentContact?.chat_status ?? "Bot";
        const lastFlow = currentContact?.last_flow ?? BOT_FLOWS.START;
        if (currentStatus === "Bot" || lastFlow === "START") {
            const mainFlow = new MainFlow(db, lastFlow, messageData);
            // Guardamos el mensaje del usuario
            await saveToChat(
                db,
                messageData.userPhoneNumber,
                messageData.userPhoneNumber,
                messageData.messageInfo.content,
                messageData.id,
                messageData.messageInfo.username
            );

            // Enviamos el respectivo mensaje
            await mainFlow.sendMessage(lastFlow);
        }
    } else if (messageData.messageInfo.type === "interactive") {
        //aqui usamos el getstatefrommessage para parsear el mensaje del menu a un mensaje normaldel tipo botflow y poder crear el objeto Mainflow
    } else {
        console.log("No es un mensaje de interacción");
        //await sendDefaultMessage(messageData, selectedStatus, db);
    }
};


export const sendMessages = async (
    db: Firestore.Firestore,
    userPhone: string,
    botPhone: string,
    message: string,
) => {
    try {
        const r = await AxiosWhatsapp().post("/messages", {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: userPhone,
            type: "text",
            text: {
                preview_url: true,
                body: message.substring(0, 4094),
            },
        });
        const waid = r.data.messages[0].id;
        // Actualizando en Firebase
        await saveToChat(db, userPhone, botPhone, message, waid);
        log("savechat succesfully");
    } catch (e) {
        if (isAxiosError(e)) {
            log("sendWhatsAppMessage axios", e.response?.data);
        } else {
            log("sendWhatsAppMessage", JSON.stringify(e));
        }
        throw e;
    }
};