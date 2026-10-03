import { StyleSheet, Text, View } from "react-native";
import { answerBlocks, superscriptCitation } from "../lib/chat-format";
import { colors } from "./ui";

export function ChatAnswerBody({ content }: { content: string }) {
  return (
    <View style={styles.body}>
      {answerBlocks(content).map((block, index) => (
        <View key={index} style={styles.row}>
          {block.number ? (
            <Text style={[styles.text, styles.number]}>{block.number}.</Text>
          ) : null}
          <Text selectable style={[styles.text, styles.content]}>
            {block.spans.map((span, spanIndex) =>
              span.kind === "citation" ? (
                <Text
                  key={spanIndex}
                  accessibilityLabel={`Sumber ${span.ids.join(", ")}`}
                  style={styles.citation}
                >
                  {superscriptCitation(span.ids)}
                </Text>
              ) : (
                <Text
                  key={spanIndex}
                  style={span.kind === "bold" ? styles.bold : undefined}
                >
                  {span.text}
                </Text>
              ),
            )}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  text: { color: colors.ink, fontSize: 15, lineHeight: 25 },
  content: { flex: 1, minWidth: 0 },
  number: { minWidth: 19, color: colors.green, fontWeight: "600" },
  bold: { fontWeight: "700" },
  // Unicode superscripts keep a stable raised baseline on Android and iOS.
  citation: { color: colors.green, fontWeight: "500" },
});
