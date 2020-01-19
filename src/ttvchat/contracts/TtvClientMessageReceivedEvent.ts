import { IBadges } from '../chatClient';
export interface TtvClientMessageReceivedEvent {
  username: string;
  message: string;
  badges: IBadges;
}
