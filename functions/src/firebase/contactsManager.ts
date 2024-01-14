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
    options?: { userName?: string; is_readed?: boolean, chat_status?: type.ChatStatus, is_iterative?: boolean }
) => {
    try {
        // const { userName = "DefaultUser", is_readed = true } = options || {};
        const userName = options?.userName ?? "Jhon Doe";
        // const is_readed = options?.is_readed ?? true;
        const chat_status = options?.chat_status ?? type.ChatStatus.BOT;
        const is_iterative = options?.is_iterative ?? false;

        const newMessage: type.MessageDataType = {
            "sender": senderPhone,
            "content": message,
            "created_at": Firestore.Timestamp.fromDate(new Date()),
            "waid": waid,
            "is_document": false,
            "url_document": ""
        };
        const contactRef = db.collection("contacts").doc(userPhone);
        const doc = await contactRef.get();

        if (doc.exists) { // Si encuentra un chat, lo actualiza
            const currentMessages: Array<type.MessageDataType> = doc.data()?.messages || [];
            const currentUnreadedMessages: Array<type.MessageDataType> = doc.data()?.unreaded_messages || [];
            currentMessages.push(newMessage);
            currentUnreadedMessages.push(newMessage);
            await doc.ref.update({
                last_message: newMessage,
                messages: currentMessages,
                last_interaction: Firestore.Timestamp.fromDate(new Date()),
                last_flow: last_flow,
                chat_status: chat_status,
                is_iterative: is_iterative,
                unreaded_messages: currentUnreadedMessages
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
                    is_iterative: is_iterative,
                    unreaded_messages: [newMessage]
                });
            console.log("Conversación creada");
        }
    } catch (error) {
        console.log("Error en saveToChat:", error);
        return;
    }
};

export const saveDocumentToChat = async (
    db: Firestore.Firestore,
    userPhone: string,
    senderPhone: string,
    urlDocument: string,
    waid: string,
    last_flow: string,
    options?: { userName?: string; is_readed?: boolean, chat_status?: type.ChatStatus, is_iterative?: boolean }
) => {
    try {
        const userName = options?.userName ?? "Jhon Doe";
        // const is_readed = options?.is_readed ?? true;
        const chat_status = options?.chat_status ?? type.ChatStatus.BOT;
        const is_iterative = options?.is_iterative ?? false;

        const newMessage: type.MessageDataType = {
            "sender": senderPhone,
            "content": "",
            "created_at": Firestore.Timestamp.fromDate(new Date()),
            "waid": waid,
            "is_document": true,
            "url_document": urlDocument
        };

        const newDocument: type.SunatDocumentsType = {
            document_url: urlDocument,
            created_at: Firestore.Timestamp.fromDate(new Date())
        }

        const contactRef = db.collection("contacts").doc(userPhone);
        const doc = await contactRef.get();

        if (doc.exists) { // Si encuentra un chat, lo actualiza
            const currentMessages: Array<type.MessageDataType> = doc.data()?.messages || [];
            const curretDocuments: Array<type.SunatDocumentsType> = doc.data()?.sunat_documents || [];
            currentMessages.push(newMessage);
            curretDocuments.push(newDocument);

            await doc.ref.update({
                last_message: newMessage,
                messages: currentMessages,
                last_interaction: Firestore.Timestamp.fromDate(new Date()),
                last_flow: last_flow,
                chat_status: chat_status,
                is_iterative: is_iterative,
                sunat_documents: curretDocuments
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
                    is_iterative: is_iterative,
                    sunat_documents: [newDocument]
                });
            console.log("Conversación creada");
        }
    } catch (error) {
        console.log("Error en saveDocumentToChat:", error);
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

export const updateChatStatus = async (
    db: Firestore.Firestore,
    userPhone: string,
) => {
    try {
        const contactRef = db.collection("contacts").doc(userPhone);
        const doc = await contactRef.get();
        const cloudtaskDate = Firestore.Timestamp.fromDate(new Date());
        cloudtaskDate.toDate().setHours(cloudtaskDate.toDate().getHours() + 3);

        if (doc.exists) { // Si encuentra un chat, lo actualiza
            await doc.ref.update({
                active_cloudtask: true,
                cloudtask_date: cloudtaskDate,
                chat_status: type.ChatStatus.BOT,
                last_flow: BOT_FLOWS.MENUOPTIONS,
                is_iterative: false
            });
            console.log("Conversación actualizada");
        } else { // Si no encuentra ningun chat
            console.log("No se encontró ningun chat");
        }
    } catch (error) {
        console.log("Error en saveDocumentToChat:", error);
        return;
    }
};

