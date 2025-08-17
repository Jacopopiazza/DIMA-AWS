export interface Chat {
  /** The user who owns the meal plan. */
  userId: string;

  /** The meal plan this chat is associated with, e.g. 'MP789'. */
  mealPlanId: string;

  /** The nutritionist ID assigned to this chat, e.g. 'N456'. */
  nutritionistId: string;

  /**
   * The text of the most recent message in the chat, if available.
   * This value is updated each time a new message is sent.
   */
  lastMessage?: string;

  /**
   * Timestamp for when the most recent message was sent.
   * Useful for displaying a "last updated" time or sorting chats by recent activity.
   */
  lastMessageTimestamp?: string;

  /**
   * Identifies who sent the most recent message. This can be "user" or "nutritionist".
   * Helps the UI indicate which party last spoke.
   */
  lastMessageSender?: 'user' | 'nutritionist';
}
