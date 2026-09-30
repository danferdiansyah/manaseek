export const ROOM_TYPES: { id: string; label: string; capacity: number; supplement: string | null }[];
export function umrahDate(value: string): string;
export function umrahUnitPrice(pkg: { basePrice: number | string; tripleSupplement: number | string; doubleSupplement: number | string }, roomType: string): number;
