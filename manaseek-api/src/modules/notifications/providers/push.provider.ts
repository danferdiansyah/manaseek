export interface PushMessage {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushSendResult {
  successCount: number;
  /** Tokens the provider reported as permanently invalid; the caller prunes them. */
  invalidTokens: string[];
}

export const PUSH_PROVIDER = Symbol('PUSH_PROVIDER');

export interface PushProvider {
  send(message: PushMessage): Promise<PushSendResult>;
}
