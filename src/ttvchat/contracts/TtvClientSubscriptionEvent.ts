export interface TtvClientSubscriptionEvent {
  username: string;
  message: string;
  tier?: "Prime" | "1000" | "2000" | "3000";
}
