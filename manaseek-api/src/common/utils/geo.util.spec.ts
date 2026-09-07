import { describe, expect, it } from 'vitest';
import { boundingBox, haversineKm } from './geo.util';

const masjidilHaram = { latitude: 21.4225, longitude: 39.8262 };
const masjidNabawi = { latitude: 24.4672, longitude: 39.6111 };

describe('haversineKm', () => {
  it('returns zero for the same point', () => {
    expect(haversineKm(masjidilHaram, masjidilHaram)).toBe(0);
  });

  it('matches the known Makkah to Madinah distance', () => {
    const distance = haversineKm(masjidilHaram, masjidNabawi);
    expect(distance).toBeGreaterThan(335);
    expect(distance).toBeLessThan(345);
  });

  it('is symmetric', () => {
    expect(haversineKm(masjidilHaram, masjidNabawi)).toBeCloseTo(
      haversineKm(masjidNabawi, masjidilHaram),
      6,
    );
  });
});

describe('boundingBox', () => {
  it('contains every point within the radius', () => {
    const radiusKm = 5;
    const box = boundingBox(masjidilHaram, radiusKm);
    const nearby = { latitude: 21.44, longitude: 39.84 };

    expect(haversineKm(masjidilHaram, nearby)).toBeLessThan(radiusKm);
    expect(nearby.latitude).toBeGreaterThanOrEqual(box.minLat);
    expect(nearby.latitude).toBeLessThanOrEqual(box.maxLat);
    expect(nearby.longitude).toBeGreaterThanOrEqual(box.minLng);
    expect(nearby.longitude).toBeLessThanOrEqual(box.maxLng);
  });

  it('stays inside valid coordinate ranges near the poles', () => {
    const box = boundingBox({ latitude: 89.9, longitude: 179.9 }, 500);
    expect(box.maxLat).toBeLessThanOrEqual(90);
    expect(box.maxLng).toBeLessThanOrEqual(180);
  });
});
