// import * as Whatsapp from "../../whatsapp/whatsapp";
import * as Firestore from "firebase-admin/firestore";
import * as type from "../../types";
import { BotState } from "../AppFlows";
import { WhatsAppInteractive } from "../../whatsapp/whatsapp";
import * as TemplateMessages from "../../whatsapp/templates/messages";
// import { BOT_FLOWS } from "../Flows";


abstract class BaseMenuState {
    public async SendMenuOptions(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        const whatsappService = new WhatsAppInteractive(db, messageData.userPhoneNumber, messageData.botPhoneNumber, );
        whatsappService.setLastFlow(lastFlow);
        await whatsappService.sendMenuOptions(TemplateMessages.StartMessage, { is_iterative: true });
    }
}

export class GPTOptionsState extends BaseMenuState implements BotState {
    private state!: string;
    constructor(flowState: string) {
        super();
        this.setState(flowState);
    }
    public setState(newval: string): void {
        this.state = newval;
    }
    async sendMessage(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        // aqui analizamos el mensaje para setearle un estado a la conversacion que es el que GPT estara analizando
        console.log("STATE");
        console.log(this.state);
        // Aqui es donde debe de enviar el mensaje de inicio de conversacion

        // switch (lastFlow) {
        //     case BOT_FLOWS.FOODMENU:
        //         await this.SendFoodMenu(db, messageData, lastFlow);
        //         break;
        //     case BOT_FLOWS.ITERATIVE:
        //         await this.SendIterativeMessage(db, messageData, lastFlow);
        //         break;
        //     default:
        //         console.log("No se ha seleccionado una opción válida");
        //         break;
        // }
    }
}