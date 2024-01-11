import { isAxiosError } from "axios";
import { AxiosWhatsapp } from "./axios/axiosWhatsapp";
import * as Firestore from "firebase-admin/firestore";
import { findContactByUserPhone, saveToChat } from "../firebase/contactsManager";
import * as type from "../types";
import { MainFlow } from "../stateMachine/MainFlow";
import { BOT_FLOWS } from "../stateMachine/Flows";

const GetStateFromMessage = (
    message: string,
): string => {
    const states: { [key: string]: string } = {
        [type.MenuOptions.FoodMenu]: BOT_FLOWS.FOODMENU,
        [type.MenuOptions.Order]: BOT_FLOWS.HUMAN,
        [type.ButtonOptions.Human]: BOT_FLOWS.HUMAN,
    };
    return states[message] || "DEFAULT";
};

export const chatStateManager = async (
    db: Firestore.Firestore,
    messageData: type.Props,) => {
    if (messageData.messageInfo.type === "text") {
        const currentContact = await findContactByUserPhone(db, messageData.userPhoneNumber);
        const currentStatus = currentContact?.chat_status ?? "Bot";
        const lastFlow = currentContact?.last_flow ?? BOT_FLOWS.MENUOPTIONS;
        if (currentStatus === "Bot" && lastFlow === BOT_FLOWS.MENUOPTIONS) {
            const mainFlow = new MainFlow(db, lastFlow, messageData);
            // Guardamos el mensaje del usuario
            await saveToChat(
                db,
                messageData.userPhoneNumber,
                messageData.userPhoneNumber,
                messageData.messageInfo.content,
                messageData.id,
                lastFlow,
                { userName: messageData.messageInfo.username }
            );

            // Enviamos el respectivo mensaje
            await mainFlow.sendMessage(lastFlow);
        } else {
            // currentStatus === "Bot" && lastFlow === "Lo que sea " ==> Si es un mensaje de texto, el status es bot pero el lastflow es otro, por ejemplo del alguna referencia del menu de opciones o quizas el usuario ya llego al final del proceso hay que enviarle un mensaje con el menu otra vez y para mas adelante conectarlo con openai
            console.log("no responde porque no sabe");
        }
    } else if (messageData.messageInfo.type === "interactive") {
        const lastFlowFromMessage = GetStateFromMessage(messageData.messageInfo.content);
        const mainFlow = new MainFlow(db, lastFlowFromMessage, messageData);
        // Guardamos el mensaje del usuario
        await saveToChat(
            db,
            messageData.userPhoneNumber,
            messageData.userPhoneNumber,
            messageData.messageInfo.content,
            messageData.id,
            lastFlowFromMessage,
            { userName: messageData.messageInfo.username }
        );

        // Enviamos el respectivo mensaje
        mainFlow.sendMessage(lastFlowFromMessage);
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
        isReaded?: boolean
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
                {is_readed: isReaded}
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
            await saveToChat(this.db, this.userPhone, this.senderPhone, message, waid, this.lastFlow);
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
    public sendMessagesFromFlutterFlow = async (
        message: string,
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
        documentLink: string,
        documentName: string
    ) => {
        try {
            const r = await AxiosWhatsapp.post('/messages', {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: this.userPhone,
                type: 'document',
                document: {
                    link: documentLink,
                    filename: documentName
                }
            });
            const waid = r.data.messages[0].id;
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

    public sendMenuOptions = async (message: string) => {
        try {
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
            await saveToChat(this.db, this.userPhone, this.senderPhone, message, waid, this.lastFlow);
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