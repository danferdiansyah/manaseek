const EARTH_RADIUS_KM = 6371;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function haversineKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Cheap rectangular prefilter so the database can use a plain btree index on
 * (latitude, longitude) before the exact haversine distance is computed.
 * Avoids needing PostGIS at this scale.
 */
export function boundingBox(center: Coordinates, radiusKm: number): BoundingBox {
  const latDelta = radiusKm / 111.32;
  const cosLat = Math.cos(toRadians(center.latitude));
  // Guard against the poles where longitude degrees collapse.
  const lngDelta = radiusKm / (111.32 * Math.max(Math.abs(cosLat), 0.01));

  return {
    minLat: Math.max(center.latitude - latDelta, -90),
    maxLat: Math.min(center.latitude + latDelta, 90),
    minLng: Math.max(center.longitude - lngDelta, -180),
    maxLng: Math.min(center.longitude + lngDelta, 180),
  };
}

export function isValidCoordinates(value: Partial<Coordinates>): value is Coordinates {
  return (
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}
