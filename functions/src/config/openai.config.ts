import * as functions from "firebase-functions";
import OpenAI from "openai";

functions.config()

export const OPENAI_API_KEY = functions.config().openai.api_key || "";

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

export const openaiChatCompletion = async (props: { systemInstruction: string, userMessage: string }) => {
    try {
        const result = await openai.chat.completions.create({
            messages: [
                { role: "system", content: props.systemInstruction },
                { role: "user", content: props.userMessage }
            ],
            model: "gpt-3.5-turbo",
        });
        return result.choices[0].message.content;
    } catch (error) {
        console.error("Openai error: ", error);
        return { "Openai error": error };
    }
}



