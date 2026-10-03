import assert from "node:assert/strict";
import { test } from "node:test";
import {
  journeys,
  journeyIds,
  emptyGuideProgress,
  normalizeGuideProgress,
  toggleGuideRead,
  nextGuideStep,
  matchesGuideStep,
} from "../src/lib/guidance-journeys";

test("umrah stays in ritual order and never includes hajj-only stages", () => {
  assert.deepEqual(
    journeys.umrah.steps.map((s) => s.id),
    ["persiapan", "ihram-umrah", "tawaf-umrah", "sai-umrah", "tahallul-umrah"],
  );
});
test("search accepts familiar spellings, apostrophes and route punctuation", () => {
  const sai = journeys.umrah.steps.find((step) => step.id === "sai-umrah")!;
  for (const query of [
    "sai",
    "sa'i",
    "SA’I",
    "Safa-Marwah",
    "shafa marwah",
    "  shafa  ",
  ])
    assert.equal(matchesGuideStep(sai, query), true);
  assert.equal(
    matchesGuideStep(
      journeys.umrah.steps.find((step) => step.id === "tawaf-umrah")!,
      "thawaf umroh",
    ),
    true,
  );
  assert.equal(matchesGuideStep(sai, "muzdalifah"), false);
});
test("tamattu includes umrah then renewed ihram, while ifrad and qiran do not have early tahallul", () => {
  const tamattu = journeys.tamattu.steps.map((s) => s.id);
  assert.ok(tamattu.indexOf("tahallul-umrah") < tamattu.indexOf("ihram-haji"));
  for (const id of ["ifrad", "qiran"] as const) {
    assert.ok(!journeys[id].steps.some((s) => s.id.endsWith("-umrah")));
    assert.ok(journeys[id].steps.some((s) => s.id === "qudum"));
  }
  for (const id of ["tamattu", "ifrad", "qiran"] as const) {
    const steps = journeys[id].steps.map((s) => s.id);
    assert.ok(steps.indexOf("wukuf") < steps.indexOf("muzdalifah"));
    assert.ok(steps.indexOf("aqabah") < steps.indexOf("mina"));
    assert.equal(steps.at(-1), "wada");
    assert.match(
      journeys[id].steps.find((s) => s.id === "ifadah")!.note!,
      /sebelum atau sesudah/,
    );
  }
});
test("every step has unique identity, concise actions and primary-publisher HTTPS references", () => {
  for (const id of journeyIds) {
    const steps = journeys[id].steps;
    assert.equal(new Set(steps.map((s) => s.id)).size, steps.length);
    for (const step of steps) {
      assert.ok(step.when && step.place && step.summary);
      assert.ok(step.actions.length >= 2 && step.actions.length <= 4);
      assert.ok(step.sources.length > 0);
      for (const source of step.sources) {
        const url = new URL(source.url);
        assert.equal(url.protocol, "https:");
        assert.ok(
          url.hostname.endsWith(".kemenag.go.id") ||
            url.hostname === "islam.nu.or.id",
        );
      }
    }
  }
});
test("reading marks persist through JSON restore, stay isolated by journey and can be undone", () => {
  const initial = emptyGuideProgress();
  const marked = toggleGuideRead(
    { ...initial, selected: "umrah" },
    "umrah",
    "persiapan",
  );
  assert.equal(nextGuideStep(marked, "umrah")?.id, "ihram-umrah");
  assert.equal(nextGuideStep(marked, "tamattu")?.id, "persiapan");
  const restored = normalizeGuideProgress(JSON.parse(JSON.stringify(marked)));
  assert.deepEqual(restored, marked);
  assert.deepEqual(
    toggleGuideRead(restored, "umrah", "persiapan").read.umrah,
    [],
  );
  assert.deepEqual(initial.read.umrah, []);
});
test("resuming follows the last unread step and handles a fully read journey", () => {
  let state = { ...emptyGuideProgress(), last: { umrah: "sai-umrah" } };
  assert.equal(nextGuideStep(state, "umrah")?.id, "sai-umrah");
  for (const step of journeys.umrah.steps)
    state = toggleGuideRead(state, "umrah", step.id) as typeof state;
  assert.equal(nextGuideStep(state, "umrah"), null);
  assert.equal(
    nextGuideStep(toggleGuideRead(state, "umrah", "tawaf-umrah"), "umrah")?.id,
    "tawaf-umrah",
  );
});
test("malformed or stale local state cannot create invalid selection, duplicate marks or unknown stages", () => {
  assert.deepEqual(normalizeGuideProgress(null), emptyGuideProgress());
  assert.deepEqual(
    normalizeGuideProgress({ version: 7 }),
    emptyGuideProgress(),
  );
  const state = normalizeGuideProgress({
    version: 1,
    selected: "invalid",
    last: { umrah: "gone" },
    read: { umrah: ["persiapan", "persiapan", "removed", null], qiran: "bad" },
  });
  assert.equal(state.selected, null);
  assert.deepEqual(state.read.umrah, ["persiapan"]);
  assert.deepEqual(state.read.qiran, []);
  assert.deepEqual(state.last, {});
  assert.equal(toggleGuideRead(state, "umrah", "invalid"), state);
});
