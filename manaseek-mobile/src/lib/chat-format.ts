export type AnswerSpan =
  { kind: "text" | "bold"; text: string } | { kind: "citation"; ids: string[] };

export type AnswerBlock = {
  number?: string;
  spans: AnswerSpan[];
};

const raisedDigits = "⁰¹²³⁴⁵⁶⁷⁸⁹";

export function superscriptCitation(ids: (string | number)[]): string {
  return ids
    .map((id) =>
      String(id).replace(/\d/g, (digit) => raisedDigits[Number(digit)]),
    )
    .join("˒");
}

/** Only our small answer format is interpreted; arbitrary Markdown/HTML stays text. */
export function answerSpans(text: string): AnswerSpan[] {
  const spans: AnswerSpan[] = [];
  const tokens = /(\*\*[^*\n]+\*\*|\[\d+\](?:[ \t]*\[\d+\])*)/g;
  let cursor = 0;
  for (const match of text.matchAll(tokens)) {
    if (match.index > cursor)
      spans.push({ kind: "text", text: text.slice(cursor, match.index) });
    const token = match[0];
    if (token.startsWith("**")) {
      // Citations within emphasis must still be raised, not rendered as brackets.
      spans.push(
        ...answerSpans(token.slice(2, -2)).map((span): AnswerSpan =>
          span.kind === "text" ? { ...span, kind: "bold" } : span,
        ),
      );
    } else {
      spans.push({ kind: "citation", ids: token.match(/\d+/g) ?? [] });
    }
    cursor = match.index + token.length;
  }
  if (cursor < text.length)
    spans.push({ kind: "text", text: text.slice(cursor) });
  return spans;
}

export function answerBlocks(content: string): AnswerBlock[] {
  const blocks: { number?: string; text: string }[] = [];
  let current: (typeof blocks)[number] | undefined;
  for (const line of content.replace(/\r\n?/g, "\n").split("\n")) {
    if (!line.trim()) {
      current = undefined;
      continue;
    }
    const numbered = line.match(/^\s*(\d{1,3})[.)]\s+(.+)$/);
    if (numbered) {
      current = { number: numbered[1], text: numbered[2] };
      blocks.push(current);
    } else if (current) {
      current.text += `\n${line.trim()}`;
    } else {
      current = { text: line.trim() };
      blocks.push(current);
    }
  }
  return blocks.map(({ number, text }) => ({
    number,
    spans: answerSpans(text),
  }));
}
