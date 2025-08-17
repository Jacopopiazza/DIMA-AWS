import { UserTypeEnum } from "./UserTypeEnum";

export interface ChatMessage {
  /**
   * Identifier of the chat to which this message belongs,
   * e.g. "CHAT#U123#MP789" or a separate chatId if you use one.
   */
  chatId: string;

  /** The time the message was sent. */
  timestamp: string;
  // could also be a Date, number (epoch), or ISO string

  /** Who sent the message; can be the user or nutritionist. */
  sender: UserTypeEnum;

  /** The textual content of the message. */
  content: string;
}
