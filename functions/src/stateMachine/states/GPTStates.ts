import * as Firestore from "firebase-admin/firestore";
import * as type from "../../types";
import { BotState } from "../AppFlows";
import { WhatsAppInteractive, WhatsAppMessages } from "../../whatsapp/whatsapp";
import * as TemplateMessages from "../../whatsapp/templates/messages";
import { findContactByUserPhone } from "../../firebase/contactsManager";
import { openaiChatCompletion } from "../../config";
import GPT_PROMPTS from "../../utils/openai/prompts";
import { BOT_FLOWS } from "../Flows";

interface SendGptMessageData {
    db: Firestore.Firestore,
    messageData: type.Props,
    flow?: string,
    gptMessage?: string
    name?: string,
    address?: string
}

abstract class BaseMenuState {
    public async SendMenuOptions(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        const whatsappService = new WhatsAppInteractive(db, messageData.userPhoneNumber, messageData.botPhoneNumber,);
        whatsappService.setLastFlow(lastFlow);
        await whatsappService.sendMenuOptions(TemplateMessages.StartMessage, { is_iterative: true });
    }
    public async SendGptMessage(
        props: SendGptMessageData
    ): Promise<void> {
        const whatsappService = new WhatsAppMessages(props.db, props.messageData.userPhoneNumber, props.messageData.botPhoneNumber,);
        whatsappService.setLastFlow(props.flow!);
        await whatsappService.sendMessages(props.gptMessage!, { chat_assistant: type.ChatAssistant.GPT, name: props.name, address: props.address });
    }
}

export class GPTOptionsState extends BaseMenuState implements BotState {

    async sendMessage(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        // aqui analizamos el mensaje para setearle un estado a la conversacion que es el que GPT estara analizando
        // Aqui es donde debe de enviar el mensaje de inicio de conversacion
        const contact = await findContactByUserPhone(db, messageData.userPhoneNumber);
        if (!contact) throw new Error("Contact not found");
        const sendGptMessageData: SendGptMessageData = {
            db: db,
            messageData: messageData,
        }

        switch (contact.last_flow) {
            case BOT_FLOWS.GPT_ORDER:
                sendGptMessageData.flow = BOT_FLOWS.GPT_ASK_NAME
                sendGptMessageData.gptMessage = GPT_PROMPTS.GPT_ORDER.greet
                this.SendGptMessage(sendGptMessageData);
                break;
            case BOT_FLOWS.GPT_ASK_NAME:
                openaiChatCompletion({
                    systemInstruction: GPT_PROMPTS.GPT_ORDER.instruction,
                    userMessage: messageData.messageInfo.content
                }).then(result => {
                    if (result?.toString().split(" ")[0].includes("NONEXT")) {
                        sendGptMessageData.flow = BOT_FLOWS.GPT_ASK_NAME
                        sendGptMessageData.gptMessage = GPT_PROMPTS.GPT_ORDER.failed
                        this.SendGptMessage(sendGptMessageData);
                    } else {
                        sendGptMessageData.flow = BOT_FLOWS.GPT_TAKE_ORDER
                        sendGptMessageData.name = result?.toString().split(" ")[1] ?? "Jhon Doe"
                        sendGptMessageData.gptMessage = GPT_PROMPTS.GPT_TAKE_ORDER.greet(sendGptMessageData.name)
                        this.SendGptMessage(sendGptMessageData);
                    }
                });
                break;
            case BOT_FLOWS.GPT_TAKE_ORDER:
                openaiChatCompletion({
                    systemInstruction: GPT_PROMPTS.GPT_TAKE_ORDER.instruction(menu),
                    userMessage: messageData.messageInfo.content
                }).then(result => {
                    if (result?.toString().split(" ")[0].includes("NONEXT")) {
                        sendGptMessageData.flow = BOT_FLOWS.GPT_TAKE_ORDER
                        sendGptMessageData.gptMessage = GPT_PROMPTS.GPT_TAKE_ORDER.failed(contact.name)
                        this.SendGptMessage(sendGptMessageData);
                    } else {
                        sendGptMessageData.flow = BOT_FLOWS.GPT_ASK_LOCATION
                        sendGptMessageData.gptMessage = GPT_PROMPTS.GPT_ASK_LOCATION.greet
                        // Se guarda en la bd la data del pedido
                        // Hay que crear un campo en la coleccion de usuarios que diga "current order" y otra coleccion de ordenes con su respectivo id. 
                        this.SendGptMessage(sendGptMessageData);
                    }
                });
                break;
            case BOT_FLOWS.GPT_ASK_LOCATION:
                openaiChatCompletion({
                    systemInstruction: GPT_PROMPTS.GPT_ASK_LOCATION.instruction,
                    userMessage: messageData.messageInfo.content
                }).then(result => {
                    console.log(result);
                    if (result?.toString().split(" ")[0].includes("NONEXT")) {
                        sendGptMessageData.flow = BOT_FLOWS.GPT_ASK_LOCATION
                        sendGptMessageData.gptMessage = GPT_PROMPTS.GPT_ASK_LOCATION.failed
                        this.SendGptMessage(sendGptMessageData);
                    } else {
                        sendGptMessageData.flow = BOT_FLOWS.GPT_ASK_OBSERVATIONS
                        sendGptMessageData.gptMessage = GPT_PROMPTS.GPT_ASK_OBSERVATIONS.greet
                        sendGptMessageData.address = result?.toString().split(" ").slice(1).join(" ")
                        this.SendGptMessage(sendGptMessageData);
                    }
                });
                break;
            case BOT_FLOWS.GPT_ASK_OBSERVATIONS:
                // Aquí se graban las observaciones

                // openaiChatCompletion({
                //     systemInstruction: GPT_PROMPTS.GPT_ASK_LOCATION.instruction,
                //     userMessage: messageData.messageInfo.content
                // }).then(result => {
                //     console.log(result);
                //     if (result?.toString().split(" ")[0].includes("NONEXT")) {
                //         sendGptMessageData.flow = BOT_FLOWS.GPT_ASK_LOCATION
                //         sendGptMessageData.gptMessage = GPT_PROMPTS.GPT_ASK_LOCATION.failed
                //         this.SendGptMessage(sendGptMessageData);
                //     } else {
                //         sendGptMessageData.flow = BOT_FLOWS.GPT_ASK_OBSERVATIONS
                //         sendGptMessageData.gptMessage = GPT_PROMPTS.GPT_ASK_OBSERVATIONS.greet
                //         sendGptMessageData.address = result?.toString().split(" ").slice(1).join(" ")
                //         this.SendGptMessage(sendGptMessageData);
                //     }
                // });
                break;
        }
    }
}

const menu = "Caldo de gallina - 15 soles, Arroz chaufa - 12 soles, Ceviche de pez espada personal - 35 soles, Ceviche de pez espada mediano - 50 soles, Lomo saltado - 25 soles."