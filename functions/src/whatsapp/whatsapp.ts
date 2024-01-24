import { isAxiosError } from "axios";
import { AxiosWhatsapp } from "./axios/axiosWhatsapp";
import * as Firestore from "firebase-admin/firestore";
import { findContactByUserPhone, saveToChat, saveDocumentToChat } from "../firebase/contactsManager";
import * as type from "../types";
import { BotFlow } from "../stateMachine/AppFlows";
import { BOT_FLOWS } from "../stateMachine/Flows";
// import { scheduleCloudTask } from "../scheduler/scheduleCloudTask";

const GetStateFromInteractiveMessage = (
    message: string,
): string => {
    const states: { [key: string]: string } = {
        // Asistente: BOT
        [type.MenuOptions.FoodMenu]: BOT_FLOWS.FOODMENU,

        // Asistente: GPT
        [type.MenuOptions.Order]: BOT_FLOWS.GPT_INIT_CONVERSATION,
        [type.ButtonOptions.Order]: BOT_FLOWS.GPT_INIT_CONVERSATION,

        // Asistente: HUMANO
    };
    return states[message] || "DEFAULT";
};

export const chatStateManager = async (
    db: Firestore.Firestore,
    messageData: type.Props,) => {
    if (messageData.messageInfo.type === "text") {
        const currentContact = await findContactByUserPhone(db, messageData.userPhoneNumber);
        const currentAssistant = currentContact?.chat_assistant ?? type.ChatAssistant.BOT;
        const lastFlowFromTextMessage = currentContact?.last_flow ?? BOT_FLOWS.MENUOPTIONS;
        const isIterative = currentContact?.is_iterative ?? false;

        // const cloudtaskDate = currentContact?.cloudtask_date ?? Firestore.Timestamp.fromDate(new Date());

        if (currentAssistant === type.ChatAssistant.BOT && lastFlowFromTextMessage === BOT_FLOWS.MENUOPTIONS) {
            // Guardamos el mensaje del usuario
            if (!isIterative) {
                await saveToChat(
                    db,
                    messageData.userPhoneNumber,
                    messageData.userPhoneNumber,
                    messageData.messageInfo.content,
                    messageData.id,
                    lastFlowFromTextMessage,
                    { is_iterative: true, }
                );

                // Enviamos el respectivo mensaje
                const botFlow = new BotFlow(db, lastFlowFromTextMessage, messageData);
                await botFlow.sendMessage();
            }

        } else if (currentAssistant === type.ChatAssistant.BOT) {
            // Cuando es iterative
            if (!currentContact?.is_iterative) {
                await saveToChat(
                    db,
                    messageData.userPhoneNumber,
                    messageData.userPhoneNumber,
                    messageData.messageInfo.content,
                    messageData.id,
                    lastFlowFromTextMessage,
                    { is_iterative: true, }
                );
                // Le enviamos un mensaje
                const botFlow = new BotFlow(db, BOT_FLOWS.ITERATIVE, messageData,);
                await botFlow.sendMessage();
            }
        } else if (currentAssistant === type.ChatAssistant.GPT) {
            if (currentContact) {
                // Aqui es cuando una persona ya esta hablando con gpt
                const gptFlow = new BotFlow(db, "GPT_TAKE_ORDER", messageData,);
                gptFlow.sendMessage();
            }
            // const cloudtaskDateObject = cloudtaskDate.toDate();
            // const currentDate = new Date();
            // Comparar las fechas
            // if (cloudtaskDateObject <= currentDate) {
            //     await saveUnreadedMessage(
            //         db,
            //         messageData.userPhoneNumber,
            //         messageData.userPhoneNumber,
            //         messageData.messageInfo.content,
            //         messageData.id,
            //         lastFlow,
            //         {
            //             userName: messageData.messageInfo.username,
            //             is_iterative: false,
            //             chat_status: type.ChatAssistant.GPT,
            //             activate_cloudtask_date: true
            //         }
            //     );
            //     await scheduleCloudTask(messageData.userPhoneNumber, currentContact);
            //     console.log("Se agendó el cloudtask date");
            // } else {
            //     await saveUnreadedMessage(
            //         db,
            //         messageData.userPhoneNumber,
            //         messageData.userPhoneNumber,
            //         messageData.messageInfo.content,
            //         messageData.id,
            //         lastFlow,
            //         { userName: messageData.messageInfo.username, is_iterative: false, chat_status: type.ChatAssistant.GPT }
            //     );
            // }
            console.log("Es atendido por GPT");
        }
    } else if (messageData.messageInfo.type === "interactive") {
        // const contact = findContactByUserPhone(db, messageData.userPhoneNumber);

        const lastFlowFromInteractiveMessage = GetStateFromInteractiveMessage(messageData.messageInfo.content);
        const chat_assistant = lastFlowFromInteractiveMessage === BOT_FLOWS.GPT_INIT_CONVERSATION ? type.ChatAssistant.GPT : type.ChatAssistant.BOT
        await saveToChat(
            db,
            messageData.userPhoneNumber,
            messageData.userPhoneNumber,
            messageData.messageInfo.content,
            messageData.id,
            lastFlowFromInteractiveMessage,
            { is_iterative: false, chat_assistant: chat_assistant }
        );

        const gptFlow = new BotFlow(db, lastFlowFromInteractiveMessage, messageData,);
        gptFlow.sendMessage();

    } else {
        console.log("No es un mensaje de interacción válido");
        //await sendDefaultMessage(messageData, selectedStatus, db);
    }
};

export class WhatsAppMessages {
    private userPhone: string;
    private db: Firestore.Firestore;

    private senderPhone: string = '';
    private lastFlow: string = '';

    constructor(db: Firestore.Firestore, userPhone: string, senderPhone: string) {
        this.db = db;
        this.userPhone = userPhone;
        this.senderPhone = senderPhone;
    }
    public setLastFlow(newVal: string) {
        this.lastFlow = newVal;
    }
    public sendMessages = async (
        message: string,
        options?: { chat_assistant?: type.ChatAssistant; }
    ) => {
        try {
            const r = await AxiosWhatsapp.post('/messages', {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: this.userPhone,
                type: 'text',
                text: {
                    preview_url: true,
                    body: message.substring(0, 4094),
                },
            });
            const waid = r.data.messages[0].id;
            await saveToChat(
                this.db,
                this.userPhone,
                this.senderPhone,
                message,
                waid,
                this.lastFlow,
                { chat_assistant: options?.chat_assistant, is_iterative: false, }
            );
            console.log('savechat succesfully');
            return waid;
        } catch (e) {
            if (isAxiosError(e)) {
                console.log('sendWhatsAppMessage axios', e.response?.data);
            } else {
                console.log('sendWhatsAppMessage', JSON.stringify(e));
            }
            throw e;
        }
    };
    public sendMessageWithButton = async (
        message: string,
        btnTitle: string,
    ) => {
        try {
            const r = await AxiosWhatsapp.post("/messages", {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: this.userPhone,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: message,
                    },
                    action: {
                        buttons: [
                            {
                                type: "reply",
                                reply: {
                                    id: "botton-1",
                                    title: btnTitle,
                                },
                            },
                        ],
                    },
                },
            });
            const waid = r.data.messages[0].id;
            await saveToChat(this.db, this.userPhone, this.senderPhone, message, waid, this.lastFlow, { is_iterative: false, });
        } catch (e) {
            if (isAxiosError(e)) {
                console.log('sendWhatAppTemplateMessage axios', e);
                throw e.response?.data;
            } else {
                console.log('sendWhatAppTemplateMessage', e);
                throw e;
            }
        }
    };
    // public sendMessagesFromFlutterFlow = async (
    //     message: string,
    // ) => {
    //     try {
    //         const r = await AxiosWhatsapp.post('/messages', {
    //             messaging_product: 'whatsapp',
    //             recipient_type: 'individual',
    //             to: this.userPhone,
    //             type: 'text',
    //             text: {
    //                 preview_url: true,
    //                 body: message.substring(0, 4094),
    //             },
    //         });
    //         const waid = r.data.messages[0].id;
    //         return waid;
    //     } catch (e) {
    //         if (isAxiosError(e)) {
    //             console.log('sendWhatsAppMessage axios', e.response?.data);
    //         } else {
    //             console.log('sendWhatsAppMessage', JSON.stringify(e));
    //         }
    //         throw e;
    //     }
    // };
}

export class WhatsAppInteractive {
    private db: Firestore.Firestore;
    private userPhone: string;

    private senderPhone: string = '';
    private lastFlow: string = '';

    constructor(db: Firestore.Firestore, userPhone: string, senderPhone: string) {
        this.userPhone = userPhone;
        this.db = db;
        this.senderPhone = senderPhone;
    }
    public setLastFlow(newVal: string) {
        this.lastFlow = newVal;
    }
    public sendDocument = async (
        props: {
            documentLink: string,
            documentName: string,
            isForSunat: boolean,
        },
        options?: { chat_assistant?: type.ChatAssistant }
    ) => {
        try {
            const r = await AxiosWhatsapp.post('/messages', {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: this.userPhone,
                type: 'document',
                document: {
                    link: props.documentLink,
                    filename: props.documentName
                }
            });
            const waid = r.data.messages[0].id;
            console.log('savechat succesfully');
            await saveDocumentToChat(
                {
                    db: this.db,
                    userPhone: this.userPhone,
                    senderPhone: this.senderPhone,
                    urlDocument: props.documentLink,
                    waid: waid,
                    last_flow: this.lastFlow,
                    isForSunat: props.isForSunat,
                },
                { chat_assistant: options?.chat_assistant, is_iterative: false }
            );
            return waid;
        } catch (e) {
            if (isAxiosError(e)) {
                console.log('sendWhatsAppMessage axios', e.response?.data);
            } else {
                console.log('sendWhatsAppMessage', JSON.stringify(e));
            }
            throw e;
        }
    };

    public sendMenuOptions = async (
        message: string,
        options?: { is_iterative?: boolean }
    ) => {
        try {
            const is_iterative = options?.is_iterative ?? false;
            const r = await AxiosWhatsapp.post("/messages", {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: this.userPhone,
                type: "interactive",
                interactive: {
                    type: "list",
                    body: {
                        text: message,
                    },
                    action: {
                        button: "Escoge una opción",
                        sections: [
                            {
                                title: "titulo1",
                                rows: [
                                    {
                                        id: "1",
                                        title: type.MenuOptions.FoodMenu,
                                    },
                                    {
                                        id: "2",
                                        title: type.MenuOptions.Order,
                                    },
                                ]
                            },
                        ],
                    },
                },
            });
            const waid = r.data.messages[0].id;
            await saveToChat(this.db, this.userPhone, this.senderPhone, message, waid, this.lastFlow, { is_iterative: is_iterative, });
            console.log('savechat succesfully');
            return waid;
        } catch (e) {
            if (isAxiosError(e)) {
                console.log('sendWhatsAppMessage axios', e.response?.data);
            } else {
                console.log('sendWhatsAppMessage', JSON.stringify(e));
            }
            throw e;
        }
    };
}