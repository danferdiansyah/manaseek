import assert from "node:assert/strict";
import { test } from "node:test";
import { referenceUrl } from "../src/lib/chat-references";
test("reference links only open HTTPS pages on supported publishers", () => {
  assert.equal(referenceUrl("https://islam.nu.or.id/doa/test"), "https://islam.nu.or.id/doa/test");
  assert.equal(referenceUrl("https://www.dar-alifta.org/ar/fatwa/details/17241/test"), "https://www.dar-alifta.org/ar/fatwa/details/17241/test");
  assert.equal(referenceUrl("https://dar-alifta.org.evil.test/ar/fatwa"), null);
  for (const url of ["javascript:alert(1)", "https://nu.or.id.evil.test/a", "https://user:pass@nu.or.id/a", "http://nu.or.id/a", "https://nu.or.id:8443/a", "not a url"]) assert.equal(referenceUrl(url), null);
});
