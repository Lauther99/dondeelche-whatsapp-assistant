import axios from "axios";
import { WHATSAPP_URL, WHATSAPP_TOKEN } from "../../config";

export const AxiosWhatsapp = () => {
  return axios.create({
    baseURL: WHATSAPP_URL,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
    },
  });
};
