import * as Firestore from "firebase-admin/firestore";

export type WhatsAppMessage = {
  object: string;
  entry: {
    id: string;
    changes: {
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts: {
          profile: {
            name: string;
          };
          wa_id: string;
        }[];
        messages?: {
          context?: {
            from: string,
            id: string
          },
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          button?: {
            text: string;
            payload: string;
          };
          type: "text" | "button" | "interactive";
          image?: {
            caption?: string,
            mime_type: string,
            sha256: string,
            id: string
          }
        }[];
        statuses?: { id: string }[];
      };
      field: string;
    }[];
  }[];
}

export type Props = {
  id: string;
  context?: {
    from: string,
    id: string
  }
  messageInfo: {
    content: string;
    type: string;
    time: string;
    role: string;
    username: string;
  };
  userPhoneNumber: string;
  botPhoneNumber: string;
  botPhoneNumberId: string;
}

export type MessageDataType = {
  sender: string,
  content: string,
  created_at: Firestore.Timestamp,
  waid: string,
  is_document: boolean,
  url_document: string
}

export type DocumentsType = {
  document_url: string,
  created_at: Firestore.Timestamp,
  is_for_sunat: boolean
}

export type ContactsCollection = {
  name: string,
  number_phone: string,
  last_interaction: string,
  chat_assistant: ChatAssistant,
  messages: Array<MessageDataType>,
  unreaded_messages: Array<MessageDataType>,
  last_message: MessageDataType,
  last_flow: string,
  photo: string,
  is_iterative: boolean,
  documents: DocumentsType[],
  cloudtask_date: Firestore.Timestamp,
  cloudtask_ids: string[],
}

export enum ChatAssistant {
  BOT = "BOT",
  HUMAN = "HUMAN",
  GPT = "GPT",
}

export enum MenuOptions {
  FoodMenu = "Carta del menú",
  Order = "Quiero hacer mi pedido",
}

export enum ButtonOptions {
  Order = "Ordenar ahora",
}

