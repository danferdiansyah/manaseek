export interface SmsMessage {
  phone: string;
  body: string;
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

export interface SmsProvider {
  send(message: SmsMessage): Promise<void>;
}
