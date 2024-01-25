import * as Firestore from "firebase-admin/firestore";
import * as type from "../../types";
import { BotState } from "../AppFlows";
import { WhatsAppInteractive, WhatsAppMessages } from "../../whatsapp/whatsapp";
import * as TemplateMessages from "../../whatsapp/templates/messages";
import { findContactByUserPhone } from "../../firebase/contactsManager";
import { openaiChatCompletion } from "../../config";
import GPT_PROMPTS from "../../openai/prompts";
import { BOT_FLOWS } from "../Flows";

abstract class BaseMenuState {
    public async SendMenuOptions(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        const whatsappService = new WhatsAppInteractive(db, messageData.userPhoneNumber, messageData.botPhoneNumber,);
        whatsappService.setLastFlow(lastFlow);
        await whatsappService.sendMenuOptions(TemplateMessages.StartMessage, { is_iterative: true });
    }
    public async SendGptMessage(db: Firestore.Firestore, messageData: type.Props, lastFlow: string, gptMessage: string): Promise<void> {
        const whatsappService = new WhatsAppMessages(db, messageData.userPhoneNumber, messageData.botPhoneNumber,);
        whatsappService.setLastFlow(lastFlow);
        await whatsappService.sendMessages(gptMessage, { chat_assistant: type.ChatAssistant.GPT });
    }
}

export class GPTOptionsState extends BaseMenuState implements BotState {

    async sendMessage(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        // aqui analizamos el mensaje para setearle un estado a la conversacion que es el que GPT estara analizando
        // Aqui es donde debe de enviar el mensaje de inicio de conversacion
        const contact = await findContactByUserPhone(db, messageData.userPhoneNumber);
        if (!contact) throw new Error("Contact not found");

        switch (contact.last_flow) {
            case BOT_FLOWS.GPT_ORDER:
                this.SendGptMessage(db, messageData, BOT_FLOWS.GPT_ASK_NAME, GPT_PROMPTS.GPT_ORDER.greet);
                break;
            case BOT_FLOWS.GPT_ASK_NAME:
                openaiChatCompletion({
                    systemInstruction: GPT_PROMPTS.GPT_ORDER.instruction,
                    userMessage: messageData.messageInfo.content
                }).then(result => {
                    if (result?.toString().split(" ")[0].includes("NONEXT")) {
                        this.SendGptMessage(db, messageData, BOT_FLOWS.GPT_ASK_NAME, GPT_PROMPTS.GPT_ORDER.failed);
                    } else {
                        this.SendGptMessage(db, messageData, BOT_FLOWS.GPT_TAKE_ORDER, GPT_PROMPTS.GPT_TAKE_ORDER.greet);
                    }
                });
                break;
            case BOT_FLOWS.GPT_TAKE_ORDER:
                openaiChatCompletion({
                    systemInstruction: GPT_PROMPTS.GPT_TAKE_ORDER.instruction(menu),
                    userMessage: messageData.messageInfo.content
                }).then(result => {
                    console.log(result);
                    if (result?.toString().split(" ")[0].includes("NONEXT")) {
                        this.SendGptMessage(db, messageData, BOT_FLOWS.GPT_TAKE_ORDER, GPT_PROMPTS.GPT_TAKE_ORDER.failed);
                    } else {
                        this.SendGptMessage(db, messageData, BOT_FLOWS.GPT_ASK_LOCATION, GPT_PROMPTS.GPT_ASK_LOCATION.greet);
                    }
                });
                break;

            case BOT_FLOWS.GPT_ASK_LOCATION:
                openaiChatCompletion({
                    systemInstruction: GPT_PROMPTS.GPT_ASK_LOCATION.instruction,
                    userMessage: messageData.messageInfo.content
                }).then(result => {
                    console.log(result);
                    // if (result?.toString().split(" ")[0].includes("NONEXT")) {
                    //     this.SendGptMessage(db, messageData, BOT_FLOWS.GPT_ASK_LOCATION, GPT_PROMPTS.GPT_ASK_LOCATION.failed);
                    // } else {
                    //     this.SendGptMessage(db, messageData, BOT_FLOWS.GPT_ASK_OBSERVATIONS, GPT_PROMPTS.GPT_ASK_OBSERVATIONS.greet);
                    // }
                });
                break;
        }
    }
}

const menu = "Caldo de gallina - 15 soles, Arroz chaufa - 12 soles, Ceviche de pez espada personal - 35 soles, Ceviche de pez espada mediano - 50 soles, Lomo saltado - 25 soles."