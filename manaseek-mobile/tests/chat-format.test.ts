import assert from "node:assert/strict";
import test from "node:test";
import {
  answerBlocks,
  answerSpans,
  superscriptCitation,
} from "../src/lib/chat-format";

test("adjacent sources are distinct, including multi-digit references", () => {
  assert.deepEqual(answerSpans("Jawaban [1][2] dan [12]."), [
    { kind: "text", text: "Jawaban " },
    { kind: "citation", ids: ["1", "2"] },
    { kind: "text", text: " dan " },
    { kind: "citation", ids: ["12"] },
    { kind: "text", text: "." },
  ]);
  assert.equal(superscriptCitation([1, 2, 12]), "¹˒²˒¹²");
});

test("emphasis may contain a citation without displaying markup", () => {
  assert.deepEqual(answerSpans("**Inti [1]** tetap [catatan]."), [
    { kind: "bold", text: "Inti " },
    { kind: "citation", ids: ["1"] },
    { kind: "text", text: " tetap [catatan]." },
  ]);
  assert.deepEqual(answerSpans("**belum ditutup"), [
    { kind: "text", text: "**belum ditutup" },
  ]);
});

test("paragraphs and numbered items preserve order, continuation and caveats", () => {
  const blocks = answerBlocks(
    "**Inti.** [1]\r\n\r\n1. Syarat pertama. [1]\r\n   Pengecualian penting.\r\n2. Syarat kedua. [2]\r\n\r\nPenutup.",
  );
  assert.equal(blocks.length, 4);
  assert.deepEqual(
    blocks.map((b) => b.number),
    [undefined, "1", "2", undefined],
  );
  assert.deepEqual(blocks[1].spans.at(-1), {
    kind: "text",
    text: "\nPengecualian penting.",
  });
});

test("legacy prose, Arabic and decimal values remain intact", () => {
  const text = "قَالَ\nNilainya 2.5, bukan daftar.\n\nParagraf lain.";
  const blocks = answerBlocks(text);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].number, undefined);
  assert.deepEqual(blocks[0].spans, [
    { kind: "text", text: "قَالَ\nNilainya 2.5, bukan daftar." },
  ]);
  assert.deepEqual(answerBlocks(" \n"), []);
});
