import * as functions from "firebase-functions";

functions.config()

export const FoodMenuPdfUrl = functions.config().data.foodmenu.url || "";