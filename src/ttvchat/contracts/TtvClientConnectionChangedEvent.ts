export interface TtvClientConnectionChangedEvent {
  connected: boolean;
  address?: string;
  port?: number;
}
