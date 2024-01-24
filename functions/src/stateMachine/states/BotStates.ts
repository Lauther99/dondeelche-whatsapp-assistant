// import * as Whatsapp from "../../whatsapp/whatsapp";
import * as Firestore from "firebase-admin/firestore";
import * as type from "../../types";
import { BotState } from "../AppFlows";
import { WhatsAppInteractive, WhatsAppMessages } from "../../whatsapp/whatsapp";
import { BOT_FLOWS } from "../Flows";
import * as TemplateMessages from "../../whatsapp/templates/messages";
import { FoodMenuPdfUrl } from "../../config";


abstract class BaseMenuState {
    public async SendMenuOptions(db: Firestore.Firestore, messageData: type.Props, lastFlow: string,): Promise<void> {
        const whatsappService = new WhatsAppInteractive(db, messageData.userPhoneNumber, messageData.botPhoneNumber,);
        whatsappService.setLastFlow(lastFlow);
        await whatsappService.sendMenuOptions(TemplateMessages.StartMessage, { is_iterative: true });
    }
    public async SendFoodMenu(db: Firestore.Firestore, messageData: type.Props, lastFlow: string,): Promise<void> {
        const whatsappInteractiveService = new WhatsAppInteractive(db, messageData.userPhoneNumber, messageData.botPhoneNumber,);
        const whatsappMessagesService = new WhatsAppMessages(db, messageData.userPhoneNumber, messageData.botPhoneNumber,);
        whatsappInteractiveService.setLastFlow(lastFlow);
        whatsappMessagesService.setLastFlow(lastFlow);

        await whatsappMessagesService.sendMessages(TemplateMessages.FoodMenuPDFMessage);
        await whatsappInteractiveService.sendDocument({ documentLink: FoodMenuPdfUrl, documentName: "Carta Donde el Che", isForSunat: false });
        await whatsappMessagesService.sendMessageWithButton(TemplateMessages.OrderMenuMessage, type.ButtonOptions.Order);
    }
    public async SendIterativeMessage(db: Firestore.Firestore, messageData: type.Props, lastFlow: string,): Promise<void> {
        const whatsappMessagesService = new WhatsAppInteractive(db, messageData.userPhoneNumber, messageData.botPhoneNumber,);
        whatsappMessagesService.setLastFlow(lastFlow);
        await whatsappMessagesService.sendMenuOptions(TemplateMessages.NotValidOptionMessage, { is_iterative: true });
    }
}

export class StartState extends BaseMenuState implements BotState {
    constructor() {
        super();
    }
    async sendMessage(db: Firestore.Firestore, messageData: type.Props, lastFlow: string,): Promise<void> {
        await this.SendMenuOptions(db, messageData, lastFlow,);
    }
}

export class MenuOptionsState extends BaseMenuState implements BotState {
    constructor() {
        super();
    }
    async sendMessage(db: Firestore.Firestore, messageData: type.Props, lastFlow: string,): Promise<void> {
        switch (lastFlow) {
            case BOT_FLOWS.FOODMENU:
                await this.SendFoodMenu(db, messageData, lastFlow,);
                break;
            case BOT_FLOWS.ITERATIVE:
                await this.SendIterativeMessage(db, messageData, lastFlow,);
                break;
            default:
                console.log("No se ha seleccionado una opción válida");
                break;
        }
    }
}
