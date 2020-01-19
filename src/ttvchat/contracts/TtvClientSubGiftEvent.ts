export interface TtvClientSubGiftEvent {
  username: string;
  streakMonths: number;
  recipient: string;
  tier?: "Prime" | "1000" | "2000" | "3000";
}
