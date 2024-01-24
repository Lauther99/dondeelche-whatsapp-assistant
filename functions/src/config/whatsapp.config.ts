import * as functions from "firebase-functions";

functions.config()

const whatsappUrl = {
    Prod: "https://graph.facebook.com/v18.0/" + (functions.config().whatsapp.botid.prod || "") + "/",
    Stage: "https://graph.facebook.com/v18.0/" + (functions.config().whatsapp.botid.stage || "") + "/",
};
const botPhone = {
    Prod: functions.config().whatsapp.botphone.prod || "",
    Stage: functions.config().whatsapp.botphone.stage || "",
};
const botPhoneId = {
    Prod: functions.config().whatsapp.botid.prod || "",
    Stage: functions.config().whatsapp.botid.stage || "",
};

const enviroment = functions.config().enviroment.state || "STAGE";

let WHATSAPP_URL = ""
let BOT_PHONE = ""
let BOT_PHONE_ID = ""

switch (enviroment) {
    case "STAGE":
        WHATSAPP_URL = whatsappUrl.Stage;
        BOT_PHONE = botPhone.Stage;
        BOT_PHONE_ID = botPhoneId.Stage;
        break;
    case "PROD":
        WHATSAPP_URL = whatsappUrl.Prod;
        BOT_PHONE = botPhone.Prod;
        BOT_PHONE_ID = botPhoneId.Prod;
        break;
    default:
        WHATSAPP_URL = "";
        BOT_PHONE = "";
        BOT_PHONE_ID = "";
        break;
}

const WHATSAPP_TOKEN = functions.config().whatsapp.token || "";
export { WHATSAPP_TOKEN, WHATSAPP_URL, BOT_PHONE, BOT_PHONE_ID }




