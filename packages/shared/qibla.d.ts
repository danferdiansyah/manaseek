export const KAABA: { latitude: number; longitude: number };
export const AT_KAABA_RADIUS_KM: number;
export function qiblaBearing(position: { latitude: number; longitude: number }): number;
export function distanceToKaabaKm(position: { latitude: number; longitude: number }): number;
export function compassPoint(bearing: number): string;
