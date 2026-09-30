export const SAR_IDR_RATE: Readonly<{ idrPerSar: number; asOf: string; sourceName: string; sourceUrl: string }>;
export const RATE_DATE: string;
export const RATE_TIME: string;
export function formatAmount(amount: number, minimumFractionDigits?: number): string;
export function convertAmount(amount: number, from: string): number;
export function parseAmount(value: string): number | null;
export function validConversion(amount: number, converted: number): boolean;
