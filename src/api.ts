import { Event } from 'vscode';

import {
  TtvClientConnectionChangedEvent,
  TtvClientMessageReceivedEvent,
  TtvClientCheerReceivedEvent,
  TtvClientHostedEvent,
  TtvClientRaidedEvent,
  TtvClientSubscriptionEvent,
  TtvClientResubEvent,
  TtvClientSubGiftEvent,
  TtvClientMysteryGiftEvent
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
  /**
   * Event that fires whenever a cheer is received.
   */
  onTtvClientCheerReceived: Event<TtvClientCheerReceivedEvent>;
  /**
   * Event that fires whenever a hosted event occurs.
   */
  onTtvClientHosted: Event<TtvClientHostedEvent>;
  /**
   * Event that fires whenver a raid occurs.
   */
  onTtvClientRaided: Event<TtvClientRaidedEvent>;
  /**
   * Event that fires whenever someone subscribes.
   */
  onTtvClientSubscriptionReceived: Event<TtvClientSubscriptionEvent>;
  /**
   * Event that fires whenever someone re-subscribes.
   */
  onTtvClientResubReceived: Event<TtvClientResubEvent>;
  /**
   * Event that fires whenever a gifted subscription occurs.
   */
  onTtvClientSubGiftReceived: Event<TtvClientSubGiftEvent>;
  /**
   * Event that fires whenever a mystery gifted subscription occurs.
   */
  onTtvClientMysterySubGiftReceived: Event<TtvClientMysteryGiftEvent>;
}
