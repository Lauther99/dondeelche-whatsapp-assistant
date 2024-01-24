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
    options?: {
        chat_assistant?: type.ChatAssistant,
        is_iterative?: boolean,
        activate_cloudtask_date?: boolean,
    }
) => {
    try {
        const is_iterative = options?.is_iterative ?? false;
        const chatAssistant = options?.chat_assistant ?? type.ChatAssistant.BOT;
        const contactRef = db.collection("contacts").doc(userPhone);
        const doc = await contactRef.get();

        const newMessage: type.MessageDataType = {
            "sender": senderPhone,
            "content": message,
            "created_at": Firestore.Timestamp.fromDate(new Date()),
            "waid": waid,
            "is_document": false,
            "url_document": ""
        };

        // const cloudTaskDateBool = options?.activate_cloudtask_date ?? false;
        // let newDate = new Date();
        // let contactDate: Firestore.Timestamp = doc.get("cloudtask_date") ?? Firestore.Timestamp.fromDate(new Date());

        // if (cloudTaskDateBool) {
        //     newDate = contactDate.toDate();
        //     newDate.setHours(newDate.getHours() + 3);
        // } else {
        //     if (contactDate.toDate() > newDate) {
        //         newDate = contactDate.toDate();
        //     }
        // }

        if (doc.exists) { // Si encuentra un chat, lo actualiza
            const currentMessages: Array<type.MessageDataType> = doc.data()?.messages || [];
            currentMessages.push(newMessage);

            await doc.ref.update({
                last_message: newMessage,
                messages: currentMessages,
                last_interaction: Firestore.Timestamp.fromDate(new Date()),
                last_flow: last_flow,
                chat_assistant: chatAssistant,
                is_iterative: is_iterative,
                // cloudtask_date: newDate,
            });
            console.log("Conversación actualizada");
        } else { // Si no encuentra ningun chat, lo crea
            await db.collection("contacts")
                .doc(userPhone)
                .create({
                    last_interaction: Firestore.Timestamp.fromDate(new Date()),
                    last_message: newMessage,
                    messages: [newMessage],
                    phone_number: userPhone,
                    photo: getRandomPic(),
                    chat_assistant: chatAssistant,
                    last_flow: BOT_FLOWS.MENUOPTIONS,
                    is_iterative: is_iterative,
                    // cloudtask_date: newDate,
                });
            console.log("Conversación creada");
        }
    } catch (error) {
        console.log("Error en saveToChat:", error);
        return;
    }
};

export const saveDocumentToChat = async (
    props: {
        db: Firestore.Firestore,
        userPhone: string,
        senderPhone: string,
        urlDocument: string,
        waid: string,
        last_flow: string,
        isForSunat: boolean,
    },
    options?: { chat_assistant?: type.ChatAssistant, is_iterative?: boolean }
) => {
    try {
        const chat_assistant = options?.chat_assistant ?? type.ChatAssistant.BOT;
        const is_iterative = options?.is_iterative ?? false;

        const newMessage: type.MessageDataType = {
            "sender": props.senderPhone,
            "content": "",
            "created_at": Firestore.Timestamp.fromDate(new Date()),
            "waid": props.waid,
            "is_document": true,
            "url_document": props.urlDocument
        };

        const newDocument: type.DocumentsType = {
            document_url: props.urlDocument,
            created_at: Firestore.Timestamp.fromDate(new Date()),
            is_for_sunat: props.isForSunat
        }

        const contactRef = props.db.collection("contacts").doc(props.userPhone);
        const doc = await contactRef.get();

        if (doc.exists) { // Si encuentra un chat, lo actualiza
            const currentMessages: Array<type.MessageDataType> = doc.data()?.messages || [];
            const curretDocuments: Array<type.DocumentsType> = doc.data()?.sunat_documents || [];
            currentMessages.push(newMessage);
            curretDocuments.push(newDocument);

            await doc.ref.update({
                last_message: newMessage,
                messages: currentMessages,
                last_interaction: Firestore.Timestamp.fromDate(new Date()),
                last_flow: props.last_flow,
                chat_assistant: chat_assistant,
                is_iterative: is_iterative,
                documents: curretDocuments
            });
            console.log("Conversación actualizada");
        } else { // Si no encuentra ningun chat, lo crea
            await props.db.collection("contacts")
                .doc(props.userPhone)
                .create({
                    last_interaction: Firestore.Timestamp.fromDate(new Date()),
                    last_message: newMessage,
                    messages: [newMessage],
                    phone_number: props.userPhone,
                    chat_status: chat_assistant,
                    photo: getRandomPic(),
                    last_flow: BOT_FLOWS.MENUOPTIONS,
                    is_iterative: is_iterative,
                    documents: [newDocument]
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
        const contactRef = db.collection("contacts").doc(userPhone.toString());
        const doc = await contactRef.get();
        const cloudtaskDate = Firestore.Timestamp.fromDate(new Date());
        const cloudtaskDateObject = cloudtaskDate.toDate();
        cloudtaskDateObject.setHours(cloudtaskDateObject.getHours() + 3);

        if (doc.exists) { // Si encuentra un chat, lo actualiza
            await doc.ref.update({
                cloudtask_date: cloudtaskDateObject,
                chat_status: type.ChatAssistant.BOT,
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

// export const saveUnreadedMessage = async (
//     db: Firestore.Firestore,
//     userPhone: string,
//     senderPhone: string,
//     message: string,
//     waid: string,
//     last_flow: string,
//     options?: {
//         userName?: string;
//         is_readed?: boolean,
//         chat_status?: type.ChatStatus,
//         is_iterative?: boolean,
//         activate_cloudtask_date?: boolean,
//     }
// ) => {
//     try {
//         // const { userName = "DefaultUser", is_readed = true } = options || {};
//         const userName = options?.userName ?? "Jhon Doe";
//         // const is_readed = options?.is_readed ?? true;
//         const chat_status = options?.chat_status ?? type.ChatStatus.BOT;
//         const is_iterative = options?.is_iterative ?? false;
//         const cloudTaskDateBool = options?.activate_cloudtask_date ?? false;

//         const newMessage: type.MessageDataType = {
//             "sender": senderPhone,
//             "content": message,
//             "created_at": Firestore.Timestamp.fromDate(new Date()),
//             "waid": waid,
//             "is_document": false,
//             "url_document": ""
//         };
//         const contactRef = db.collection("contacts").doc(userPhone);
//         const doc = await contactRef.get();

//         let newDate = new Date();
//         let contactDate: Firestore.Timestamp = doc.get("cloudtask_date") ?? Firestore.Timestamp.fromDate(new Date());

//         if (cloudTaskDateBool) {
//             newDate = contactDate.toDate();
//             newDate.setHours(newDate.getHours() + 3);
//         } else {
//             if (contactDate.toDate() > newDate) {
//                 newDate = contactDate.toDate();
//             }
//         }

//         if (doc.exists) { // Si encuentra un chat, lo actualiza
//             const currentMessages: Array<type.MessageDataType> = doc.data()?.messages || [];
//             const unreadedMessages: Array<type.MessageDataType> = doc.data()?.unreaded_messages || [];
//             currentMessages.push(newMessage);
//             unreadedMessages.push(newMessage);

//             await doc.ref.update({
//                 last_message: newMessage,
//                 messages: currentMessages,
//                 last_interaction: Firestore.Timestamp.fromDate(new Date()),
//                 last_flow: last_flow,
//                 chat_status: chat_status,
//                 is_iterative: is_iterative,
//                 cloudtask_date: newDate,
//                 unreaded_messages: unreadedMessages,
//             });
//             console.log("Conversación actualizada");
//         } else { // Si no encuentra ningun chat, lo crea
//             await db.collection("contacts")
//                 .doc(userPhone)
//                 .create({
//                     last_interaction: Firestore.Timestamp.fromDate(new Date()),
//                     last_message: newMessage,
//                     messages: [newMessage],
//                     name: userName ?? "Jhon Doe",
//                     phone_number: userPhone,
//                     chat_status: chat_status,
//                     photo: getRandomPic(),
//                     last_flow: BOT_FLOWS.MENUOPTIONS,
//                     is_iterative: is_iterative,
//                     unreaded_messages: [newMessage],
//                     cloudtask_date: newDate,
//                 });
//             console.log("Conversación creada");
//         }
//     } catch (error) {
//         console.log("Error en saveToChat:", error);
//         return;
//     }
// };