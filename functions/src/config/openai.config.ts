import * as functions from "firebase-functions";

functions.config()

export const OPENAI_API_KEY = functions.config().openai.api_key || "";


