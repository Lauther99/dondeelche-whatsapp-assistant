import * as Firestore from "firebase-admin/firestore";
import * as type from "../types";
import { getRandomPic } from "../utils/getRandomPic"


export const saveToChat = async (
    db: Firestore.Firestore,
    userPhone: string,
    senderPhone: string,
    message: string,
    waid: string,
    userName?: string,
) => {
    try {
        const newMessage: type.MessageDataType = {
            "sender": senderPhone,
            "content": message,
            "is_readed": true,
            "created_at": Firestore.Timestamp.fromDate(new Date()),
            "waid": waid,
        };
        const contactRef = db.collection("contacts").doc(userPhone);
        const doc = await contactRef.get();

        if (doc.exists) { // Si encuentra un chat, lo actualiza
            const currentMessages: Array<type.MessageDataType> = doc.data()?.messages || [];
            currentMessages.push(newMessage);
            await doc.ref.update({ last_message: newMessage, messages: currentMessages, last_interaction: Firestore.Timestamp.fromDate(new Date()) });
            console.log("Conversación actualizada");
        } else { // Si no encuentra ningun chat, lo crea
            await db.collection("contacts")
                .doc(userPhone)
                .create({
                    last_interaction: Firestore.Timestamp.fromDate(new Date()),
                    last_message: newMessage,
                    messages: [newMessage],
                    name: userName ?? "Jhon Doe",
                    phone_number: userPhone,
                    chat_status: type.ChatStatus.Bot,
                    photo: getRandomPic(),
                    last_flow: type.LastFlowStatus.START
                });
            console.log("Conversación creada");
        }
    } catch (error) {
        console.log("Error en saveToChat:", error);
        return;
    }
};

export const findContactByUserPhone = async (
    db: Firestore.Firestore,
    userPhone: string,): Promise<type.ContactsCollection | null> => {
    try {
        const chat = db.collection("contacts").doc(userPhone);
        const chatSnapshot = await chat.get();
        if (chatSnapshot.exists) {
            const contactData = chatSnapshot.data();
            if (!contactData) return null;
            return contactData as type.ContactsCollection;
        }
        return null;
    } catch (error) {
        console.log("Error en saveToChat:", error);
        return null;
    }
};


