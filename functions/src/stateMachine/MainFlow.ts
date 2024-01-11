import { BOT_FLOWS } from "./Flows";
import * as type from "../types";
import { StartState, MenuOptionsState } from "./states/BotStates";
import * as Firestore from "firebase-admin/firestore";


export const getState = (state: string): MainState => {
    const states: { [key: string]: MainState } = {
        [BOT_FLOWS.MENUOPTIONS]: new StartState(),
        [BOT_FLOWS.FOODMENU]: new MenuOptionsState(),
        [BOT_FLOWS.HUMAN]: new MenuOptionsState(),
    };

    if (!state) {
        console.log("user last flow is null", state);
    }

    if (!states[state]) {
        console.log("State not found", state);
    }

    return states[state];
};

export interface MainState {
    sendMessage(db: Firestore.Firestore, messageData: type.Props, lastFlow: string): Promise<void>;
}

export class MainFlow {
    private state!: MainState;
    private db!: Firestore.Firestore;
    private messageData!: type.Props;

    constructor(db: Firestore.Firestore, state: string, messageData: type.Props) {
        this.setState(getState(state));
        this.setMessageData(messageData);
        this.setDb(db);
    }

    public setState(state: MainState): void {
        this.state = state;
    }
    public setDb(db: Firestore.Firestore): void {
        this.db = db;
    }
    public setMessageData(messageData: type.Props): void {
        this.messageData = messageData;
    }

    public async sendMessage(lastFlow: string): Promise<void> {
        await this.state.sendMessage(this.db, this.messageData, lastFlow);
    }
}
