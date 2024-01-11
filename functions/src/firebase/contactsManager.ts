import * as Firestore from "firebase-admin/firestore";
import * as type from "../types";
import { getRandomPic } from "../utils/getRandomPic"
import { BOT_FLOWS } from "../stateMachine/Flows";


export const saveToChat = async (
    db: Firestore.Firestore,
    userPhone: string,
    senderPhone: string,
    message: string,
    waid: string,
    last_flow: string,
    options?: { userName?: string; is_readed?: boolean, chat_status?: type.ChatStatus, is_iterative?: boolean}
) => {
    try {
        // const { userName = "DefaultUser", is_readed = true } = options || {};
        const userName = options?.userName ?? "Jhon Doe";
        const is_readed = options?.is_readed ?? true;
        const chat_status = options?.chat_status ?? type.ChatStatus.BOT;
        const is_iterative = options?.is_iterative ?? false;

        const newMessage: type.MessageDataType = {
            "sender": senderPhone,
            "content": message,
            "is_readed": is_readed,
            "created_at": Firestore.Timestamp.fromDate(new Date()),
            "waid": waid,
        };
        const contactRef = db.collection("contacts").doc(userPhone);
        const doc = await contactRef.get();

        if (doc.exists) { // Si encuentra un chat, lo actualiza
            const currentMessages: Array<type.MessageDataType> = doc.data()?.messages || [];
            currentMessages.push(newMessage);
            await doc.ref.update({ 
                last_message: newMessage, 
                messages: currentMessages, 
                last_interaction: Firestore.Timestamp.fromDate(new Date()),
                last_flow: last_flow,
                chat_status: chat_status,
                is_iterative: is_iterative
            });
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
                    chat_status: chat_status,
                    photo: getRandomPic(),
                    last_flow: BOT_FLOWS.MENUOPTIONS,
                    is_iterative: is_iterative
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


