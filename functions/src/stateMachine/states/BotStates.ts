// import * as Whatsapp from "../../whatsapp/whatsapp";
import * as Firestore from "firebase-admin/firestore";
import * as type from "../../types";
import { MainState } from "../MainFlow";
import { WhatsAppInteractive, WhatsAppMessages } from "../../whatsapp/whatsapp";
import { BOT_FLOWS } from "../Flows";
import * as TemplateMessages from "../../whatsapp/templates/messages";
import { FoodMenuPdfUrl } from "../../config";


abstract class BaseMenuState {
    public async SendMenuOptions(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        const whatsappService = new WhatsAppInteractive(db, messageData.userPhoneNumber, messageData.botPhoneNumber);
        whatsappService.setLastFlow(lastFlow);
        await whatsappService.sendMenuOptions(TemplateMessages.StartMessage, { is_iterative: true });
    }
    public async SendFoodMenu(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        const whatsappInteractiveService = new WhatsAppInteractive(db, messageData.userPhoneNumber, messageData.botPhoneNumber);
        const whatsappMessagesService = new WhatsAppMessages(db, messageData.userPhoneNumber, messageData.botPhoneNumber);
        whatsappInteractiveService.setLastFlow(lastFlow);
        whatsappMessagesService.setLastFlow(lastFlow);

        await whatsappMessagesService.sendMessages(TemplateMessages.FoodMenuPDFMessage);
        await whatsappInteractiveService.sendDocument(FoodMenuPdfUrl, "Carta Donde el Che", false); //TODO: Grabar algo respecto al PDF en firebase para que se vea en la interfaz
        await whatsappMessagesService.sendMessageWithButton(TemplateMessages.OrderMenuMessage, type.ButtonOptions.Human);
    }
    public async SendHumanAssistance(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        const whatsappMessagesService = new WhatsAppMessages(db, messageData.userPhoneNumber, messageData.botPhoneNumber);
        whatsappMessagesService.setLastFlow(lastFlow);
        await whatsappMessagesService.sendMessages(
            TemplateMessages.SendHumanAssistanceMessage,
            { isUnreaded: true, chat_status: type.ChatStatus.HUMAN }
        );
    }
    public async SendIterativeMessage(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        const whatsappMessagesService = new WhatsAppInteractive(db, messageData.userPhoneNumber, messageData.botPhoneNumber);
        whatsappMessagesService.setLastFlow(lastFlow);
        await whatsappMessagesService.sendMenuOptions(TemplateMessages.NotValidOptionMessage, { is_iterative: true });
    }
}

export class StartState extends BaseMenuState implements MainState {
    constructor() {
        super();
    }
    async sendMessage(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        await this.SendMenuOptions(db, messageData, lastFlow);
    }
}

export class MenuOptionsState extends BaseMenuState implements MainState {
    constructor() {
        super();
    }
    async sendMessage(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        switch (lastFlow) {
            case BOT_FLOWS.FOODMENU:
                await this.SendFoodMenu(db, messageData, lastFlow);
                break;
            case BOT_FLOWS.HUMAN:
                await this.SendHumanAssistance(db, messageData, lastFlow);
                break;
            case BOT_FLOWS.ITERATIVE:
                await this.SendIterativeMessage(db, messageData, lastFlow);
                break;
            default:
                console.log("No se ha seleccionado una opción válida");
                break;
        }
    }
}