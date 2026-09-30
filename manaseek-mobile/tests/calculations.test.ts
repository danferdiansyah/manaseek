import { test } from "node:test";
import assert from "node:assert/strict";
import { qiblaBearing } from "../../packages/shared/qibla.js";
import { methodFor, prayerTimes } from "../../packages/shared/prayer-times.js";
import {
  convertAmount,
  parseAmount,
  validConversion,
} from "../../packages/shared/currency.js";
test("the shared qibla calculation retains the Jakarta bearing", () => {
  assert.ok(
    Math.abs(
      qiblaBearing({ latitude: -6.2088, longitude: 106.8456 }) - 295.15,
    ) < 0.3,
  );
});
test("the calculation method follows Saudi Arabia and Indonesia", () => {
  const saudi = { latitude: 21.4225, longitude: 39.8262 };
  assert.equal(methodFor(saudi).id, "UMM_AL_QURA");
  assert.equal(
    methodFor({ latitude: -6.2088, longitude: 106.8456 }).id,
    "KEMENAG",
  );
  const times = prayerTimes({
    ...saudi,
    date: new Date("2026-09-30T12:00:00Z"),
  }).times;
  assert.equal(times.filter((t) => !t.informational).length, 5);
  assert.ok(times.every((t) => t.at && Number.isFinite(t.at.getTime())));
});
test("Indonesian currency input works without a network dependency", () => {
  assert.equal(parseAmount("1.500,50"), 1500.5);
  assert.equal(parseAmount(""), null);
  const idr = convertAmount(100, "SAR");
  assert.ok(Math.abs(convertAmount(idr, "IDR") - 100) < 0.00001);
  assert.equal(validConversion(Number.NaN, 100), false);
});
