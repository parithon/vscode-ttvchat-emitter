import { Event } from 'vscode';

import {
  TtvClientConnectionChangedEvent,
  TtvClientMessageReceivedEvent
} from './ttvchat';

export interface TtvChatEmitterAPI {
  /**
   * Send a message to your twitch chat audience
   * @param message The message to send
   */
  sendMessage(message: string): Promise<void>;
  /**
   * Event that fires when the twitch chat client connects or disconnects
   */
  onTtvClientConnectionChanged: Event<TtvClientConnectionChangedEvent>;
  /**
   * Event that fires whenever a message is received.
   */
  onTtvClientRecievedMessage: Event<TtvClientMessageReceivedEvent>;
}
