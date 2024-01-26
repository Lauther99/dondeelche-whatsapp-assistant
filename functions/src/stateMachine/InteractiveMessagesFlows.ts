import * as type from "../types";
import { BOT_FLOWS } from "./Flows";

export const INTERACTIVE_FLOWS = {
    // MENU INICIAL
    INITIAL_MENU: "INITIAL_MENU",
    ORDER_BUTTON: "ORDER_BUTTON"
};


export const GetStateFromInteractiveMessage = (
    id: string,
    message: string,
): string => {
    const states: { [key: string]: { [key: string]: string } } = {
        [INTERACTIVE_FLOWS.INITIAL_MENU]: {
            [type.MenuOptions.FoodMenu]: BOT_FLOWS.FOODMENU,
            [type.MenuOptions.Order]: BOT_FLOWS.GPT_ORDER,
        },

        [INTERACTIVE_FLOWS.ORDER_BUTTON]: {
            [type.ButtonOptions.Order]: BOT_FLOWS.GPT_ORDER,
        },

    };
    return states[id][message] || "DEFAULT";
};