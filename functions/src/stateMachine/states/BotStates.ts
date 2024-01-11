// import * as Whatsapp from "../../whatsapp/whatsapp";
import * as Firestore from "firebase-admin/firestore";
import * as type from "../../types";
import { MainState } from "../MainFlow";


abstract class BaseBotState {
    public async SendFoodMenu(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void> {
        //   const whatsappService = new WhatsAppMessages(db: Firestore.Firestore, messageData.userPhoneNumber, messageData.botPhoneNumber);
        //   whatsappService.setMessage(message);
        //   await whatsappService.sendGeneralMessage(false, lastFlow);
        console.log("hola desde sendfoodMenu");
    }

    public async SolicitarAtencionHumana(db: Firestore.Firestore, message: string, messageData: type.Props, lastFlow: string): Promise<void> {
        //   const whatsappService = new WhatsAppMessages(messageData.userPhoneNumber, messageData.botPhoneNumber);
        //   whatsappService.setMessage(message);
        //   await whatsappService.sendGeneralMessage(false, lastFlow);
    }

}


export class MenuState extends BaseBotState implements MainState {
    constructor() {
        super();
    }
    async sendMessage(db: Firestore.Firestore, messageData: type.Props): Promise<void> {
        //   const whatsappService = new WhatsAppMessages(messageData.userPhoneNumber, messageData.botPhoneNumber);
        //   if (this.status === RateStateStatus.Good) {
        //     whatsappService.setMessage(responses[2]);
        //   } else if (this.status === RateStateStatus.Bad) {
        //     whatsappService.setMessage(responses[3]);
        //   }
        await this.SendFoodMenu(db, messageData, "Menu");
    }
}