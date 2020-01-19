export interface TtvClientResubEvent {
  username: string;
  months: number;
  message: string;
  tier?: "Prime" | "1000" | "2000" | "3000";
}
