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
  is_readed: boolean,
  created_at: Firestore.Timestamp,
  waid: string,
}

export type ContactsCollection = {
  name: string,
  number_phone: string,
  last_interaction: string,
  chat_status: ChatStatus,
  messages: Array<MessageDataType>,
  last_message: MessageDataType,
  last_flow: string,
  photo: string,
}

export enum ChatStatus {
  Bot = "Bot",
  Human = "Human",
}

export enum MenuOptions {
  FoodMenu = "Carta del menú",
  Order = "Quiero hacer mi pedido",
}

export enum ButtonOptions {
  Human = "Ordenar ahora",
}

