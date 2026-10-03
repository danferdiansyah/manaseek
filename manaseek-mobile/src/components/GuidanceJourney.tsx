import { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { colors } from "./ui";
import {
  journeys,
  matchesGuideStep,
  nextGuideStep,
  toggleGuideRead,
  type GuideProgress,
  type GuideSource,
  type JourneyId,
} from "../lib/guidance-journeys";

type Props = {
  progress: GuideProgress;
  onChange(value: GuideProgress): void;
  onLibrary(): void;
  onPrayers(): void;
  onChecklist(): void;
  onSource(source: GuideSource): void;
  sourceError: string | null;
  saveError: string | null;
  onRetrySave(): void;
  topInset: number;
  bottomInset: number;
};
export function GuidanceJourney({
  progress,
  onChange,
  onLibrary,
  onPrayers,
  onChecklist,
  onSource,
  sourceError,
  saveError,
  onRetrySave,
  topInset,
  bottomInset,
}: Props) {
  const [choosing, setChoosing] = useState(!progress.selected);
  const [hajjChoice, setHajjChoice] = useState(false);
  const [stepId, setStepId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const detailScroll = useRef<ScrollView>(null);
  const journey = progress.selected ? journeys[progress.selected] : null;
  const stepIndex =
    journey?.steps.findIndex((step) => step.id === stepId) ?? -1;
  const step = journey?.steps[stepIndex];
  const read = journey ? progress.read[journey.id] : [];
  const next = journey ? nextGuideStep(progress, journey.id) : null;
  function choose(id: JourneyId) {
    onChange({ ...progress, selected: id });
    setChoosing(false);
    setHajjChoice(false);
    setSearch("");
  }
  function openStep(id: string) {
    setStepId(id);
    if (journey)
      onChange({ ...progress, last: { ...progress.last, [journey.id]: id } });
    detailScroll.current?.scrollTo({ y: 0, animated: false });
  }
  const filtered =
    journey?.steps.filter((item) => matchesGuideStep(item, search)) ?? [];
  return (
    <View style={styles.content}>
      {saveError ? (
        <Pressable accessibilityRole="button" onPress={onRetrySave}>
          <Text accessibilityRole="alert" style={{ color: colors.red }}>
            {saveError}
          </Text>
        </Pressable>
      ) : null}
      {choosing || !journey ? (
        <>
          <View style={styles.sectionIntro}>
            <Text style={styles.eyebrow}>MULAI DARI PERJALANANMU</Text>
            <Text accessibilityRole="header" style={styles.heading}>
              {hajjChoice ? "Pilih cara berhaji" : "Umrah atau Haji?"}
            </Text>
            <Text style={styles.body}>
              {hajjChoice
                ? "Sesuaikan dengan rencana bersama pembimbingmu."
                : "Panduan berurutan, agar tahu apa yang perlu dilakukan di setiap tahap."}
            </Text>
          </View>
          {hajjChoice ? (
            <>
              {(["tamattu", "ifrad", "qiran"] as const).map((id) => (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={`Pilih ${journeys[id].title}`}
                  onPress={() => choose(id)}
                  style={({ pressed }) => [
                    styles.choice,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.grow}>
                    <Text style={styles.choiceTitle}>{journeys[id].title}</Text>
                    <Text style={styles.body}>{journeys[id].description}</Text>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={22}
                    color={colors.green}
                  />
                </Pressable>
              ))}
              <Text style={styles.caption}>
                Belum tahu jenis hajimu? Tanyakan kepada pembimbing sebelum
                memilih alur.
              </Text>
              <Action
                label="Kembali ke pilihan ibadah"
                secondary
                onPress={() => setHajjChoice(false)}
              />
            </>
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pilih Umrah"
                onPress={() => choose("umrah")}
                style={({ pressed }) => [
                  styles.choice,
                  styles.umrahChoice,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[styles.choiceIcon, { backgroundColor: "#2A6B52" }]}
                >
                  <Ionicons name="moon-outline" size={27} color="#E7CF9F" />
                </View>
                <View style={styles.grow}>
                  <Text style={[styles.choiceTitle, styles.white]}>Umrah</Text>
                  <Text style={styles.onGreen}>
                    Ihram, tawaf, sa’i, lalu tahallul.
                  </Text>
                  <Text style={styles.choiceMeta}>5 tahap panduan</Text>
                </View>
                <Ionicons name="arrow-forward" size={23} color="#FFF" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pilih Haji"
                onPress={() => setHajjChoice(true)}
                style={({ pressed }) => [
                  styles.choice,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.choiceIcon}>
                  <Ionicons
                    name="sunny-outline"
                    size={28}
                    color={colors.gold}
                  />
                </View>
                <View style={styles.grow}>
                  <Text style={styles.choiceTitle}>Haji</Text>
                  <Text style={styles.body}>
                    Dari miqat, Arafah, hingga kepulangan.
                  </Text>
                  <Text style={styles.caption}>Tamattu’ · Ifrad · Qiran</Text>
                </View>
                <Ionicons name="arrow-forward" size={23} color={colors.green} />
              </Pressable>
              {journey ? (
                <Action
                  label={`Kembali ke ${journey.title}`}
                  secondary
                  onPress={() => setChoosing(false)}
                />
              ) : null}
              <View style={styles.offline}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={18}
                  color={colors.green}
                />
                <Text style={styles.caption}>
                  Alur dan ringkasan siap dibaca tanpa internet.
                </Text>
              </View>
            </>
          )}
        </>
      ) : (
        <>
          <View style={styles.between}>
            <View style={styles.grow}>
              <Text style={styles.eyebrow}>PERJALANAN PILIHANMU</Text>
              <Text accessibilityRole="header" style={styles.heading}>
                {journey.title}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ganti jenis ibadah"
              style={styles.change}
              onPress={() => {
                setChoosing(true);
                setHajjChoice(false);
              }}
            >
              <Ionicons name="swap-horizontal" size={17} color={colors.green} />
              <Text style={styles.changeLabel}>Ganti</Text>
            </Pressable>
          </View>
          <View style={styles.resume}>
            <View style={styles.between}>
              <Text style={styles.choiceMeta}>
                {read.length} dari {journey.steps.length} tahap sudah dibaca
              </Text>
              <Ionicons name="bookmark-outline" size={19} color="#E7CF9F" />
            </View>
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Tahap sudah dibaca"
              accessibilityValue={{
                min: 0,
                max: journey.steps.length,
                now: read.length,
              }}
              style={styles.progressTrack}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${(read.length / journey.steps.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={[styles.resumeTitle, styles.white]}>
              {next ? next.title : "Semua tahap sudah kamu baca"}
            </Text>
            <Text style={styles.onGreen}>
              {next
                ? next.summary
                : "Buka kembali tahap mana pun saat dibutuhkan."}
            </Text>
            {next ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => openStep(next.id)}
                style={styles.resumeButton}
              >
                <Text style={styles.resumeLabel}>
                  {read.length || progress.last[journey.id]
                    ? "Lanjutkan panduan"
                    : "Mulai panduan"}
                </Text>
                <Ionicons name="arrow-forward" size={19} color={colors.green} />
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.caption}>{journey.note}</Text>
          <View style={styles.sectionIntro}>
            <Text accessibilityRole="header" style={styles.subheading}>
              Urutan perjalanan
            </Text>
            <Text style={styles.caption}>
              Buka tahap mana pun sesuai kebutuhanmu.
            </Text>
          </View>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={19} color={colors.muted} />
            <TextInput
              accessibilityLabel="Cari tahap ibadah"
              placeholder="Cari tahap atau tempat…"
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>
          <View>
            {filtered.map((item, index) => {
              const number = journey.steps.indexOf(item) + 1;
              const done = read.includes(item.id);
              return (
                <View key={item.id} style={styles.timelineRow}>
                  <View style={styles.rail}>
                    <View style={[styles.stepNumber, done && styles.stepDone]}>
                      {done ? (
                        <Ionicons name="checkmark" size={18} color="#FFF" />
                      ) : (
                        <Text style={styles.numberLabel}>{number}</Text>
                      )}
                    </View>
                    {index < filtered.length - 1 ? (
                      <View style={styles.connector} />
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${number}. ${item.title}${done ? ", sudah dibaca" : ""}`}
                    onPress={() => openStep(item.id)}
                    style={({ pressed }) => [
                      styles.stage,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.stageDate}>{item.when}</Text>
                    <View style={styles.between}>
                      <Text style={[styles.stageTitle, styles.grow]}>
                        {item.title}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.green}
                      />
                    </View>
                    <Text style={styles.caption}>{item.place}</Text>
                  </Pressable>
                </View>
              );
            })}
            {!filtered.length ? (
              <View style={styles.empty}>
                <Text style={styles.body}>
                  Tahap tidak ditemukan. Coba “tawaf”, “miqat”, atau nama
                  tempat.
                </Text>
                <Action
                  label="Tampilkan semua tahap"
                  secondary
                  onPress={() => setSearch("")}
                />
              </View>
            ) : null}
          </View>
          <Text style={styles.caption}>
            Penanda bacaan tersimpan di perangkat ini. Bukan penanda selesai
            melaksanakan ibadah.
          </Text>
        </>
      )}
      <View style={styles.tools}>
        <Text accessibilityRole="header" style={styles.subheading}>
          Bekal pendamping
        </Text>
        <Tool
          icon="reader-outline"
          title="Kumpulan doa"
          subtitle="Bacaan Arab dan terjemahan"
          onPress={onPrayers}
        />
        <Tool
          icon="checkbox-outline"
          title="Checklist perjalanan"
          subtitle="Siapkan perlengkapanmu"
          onPress={onChecklist}
        />
        <Tool
          icon="library-outline"
          title="Perpustakaan panduan"
          subtitle="Cari topik dan unduh bacaan tambahan"
          onPress={onLibrary}
        />
      </View>
      <Text style={styles.caption}>
        Ringkasan mengacu pada Kemenag dan NU Online. Sumber tersedia di setiap
        tahap; praktik dan keringanan ibadah dikonfirmasi bersama pembimbing.
      </Text>
      <Modal
        visible={!!step}
        animationType="slide"
        onRequestClose={() => setStepId(null)}
      >
        {step && journey ? (
          <View style={[styles.detail, { paddingTop: topInset }]}>
            <StatusBar style="dark" />
            <View style={styles.detailNav}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kembali ke urutan perjalanan"
                onPress={() => setStepId(null)}
                style={styles.close}
              >
                <Ionicons name="arrow-back" size={24} color={colors.green} />
              </Pressable>
              <View style={styles.grow}>
                <Text style={styles.changeLabel}>{journey.title}</Text>
                <Text style={styles.caption}>
                  Tahap {stepIndex + 1} dari {journey.steps.length}
                </Text>
              </View>
              <Text style={styles.readBadge}>
                {read.includes(step.id) ? "Sudah dibaca" : "Panduan"}
              </Text>
            </View>
            <ScrollView
              ref={detailScroll}
              contentContainerStyle={styles.detailContent}
            >
              <Text style={styles.eyebrow}>
                {step.phase.toLocaleUpperCase("id")}
              </Text>
              <Text accessibilityRole="header" style={styles.detailTitle}>
                {step.title}
              </Text>
              <View style={styles.facts}>
                <View style={styles.fact}>
                  <Ionicons name="time-outline" size={17} color={colors.gold} />
                  <Text style={[styles.caption, styles.grow]}>{step.when}</Text>
                </View>
                <View style={styles.fact}>
                  <Ionicons
                    name="location-outline"
                    size={17}
                    color={colors.gold}
                  />
                  <Text style={[styles.caption, styles.grow]}>
                    {step.place}
                  </Text>
                </View>
              </View>
              <Text style={styles.summary}>{step.summary}</Text>
              <View style={styles.instructions}>
                <Text accessibilityRole="header" style={styles.subheading}>
                  Yang perlu dilakukan
                </Text>
                {step.actions.map((action, i) => (
                  <View key={action} style={styles.instruction}>
                    <Text style={styles.instructionNumber}>{i + 1}.</Text>
                    <Text style={[styles.body, styles.grow]}>{action}</Text>
                  </View>
                ))}
              </View>
              {step.note ? (
                <View style={styles.note}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={colors.gold}
                  />
                  <Text style={[styles.noteText, styles.grow]}>
                    {step.note}
                  </Text>
                </View>
              ) : null}
              <View style={styles.sources}>
                <Text accessibilityRole="header" style={styles.subheading}>
                  Sumber panduan
                </Text>
                {step.sources.map((item) => (
                  <Pressable
                    key={item.url}
                    accessibilityRole="link"
                    onPress={() => onSource(item)}
                    style={styles.source}
                  >
                    <Text style={[styles.sourceTitle, styles.grow]}>
                      {item.title}
                    </Text>
                    <Ionicons
                      name="open-outline"
                      size={17}
                      color={colors.green}
                    />
                  </Pressable>
                ))}
                <Text style={styles.caption}>
                  Tautan sumber membutuhkan internet.
                </Text>
                {sourceError ? (
                  <Text accessibilityRole="alert" style={{ color: colors.red }}>
                    {sourceError}
                  </Text>
                ) : null}
              </View>
            </ScrollView>
            <View
              style={[
                styles.detailFooter,
                { paddingBottom: Math.max(bottomInset, 14) },
              ]}
            >
              {saveError ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onRetrySave}
                  style={{ paddingBottom: 10 }}
                >
                  <Text
                    accessibilityRole="alert"
                    style={{ color: colors.red, fontSize: 12 }}
                  >
                    {saveError}
                  </Text>
                </Pressable>
              ) : null}
              <Action
                label={
                  read.includes(step.id)
                    ? "Sudah dibaca · batalkan tanda"
                    : "Tandai sudah dibaca"
                }
                secondary={read.includes(step.id)}
                onPress={() =>
                  onChange(toggleGuideRead(progress, journey.id, step.id))
                }
              />
              <View style={styles.between}>
                <Pressable
                  accessibilityRole="button"
                  disabled={stepIndex === 0}
                  accessibilityState={{ disabled: stepIndex === 0 }}
                  onPress={() => openStep(journey.steps[stepIndex - 1].id)}
                  style={[
                    styles.navButton,
                    stepIndex === 0 && { opacity: 0.3 },
                  ]}
                >
                  <Ionicons
                    name="chevron-back"
                    size={17}
                    color={colors.green}
                  />
                  <Text style={styles.changeLabel}>Sebelumnya</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    stepIndex < journey.steps.length - 1
                      ? openStep(journey.steps[stepIndex + 1].id)
                      : setStepId(null)
                  }
                  style={styles.navButton}
                >
                  <Text style={styles.changeLabel}>
                    {stepIndex < journey.steps.length - 1
                      ? "Berikutnya"
                      : "Kembali ke alur"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={colors.green}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}
function Action({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress(): void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        secondary && { backgroundColor: colors.light },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionLabel, secondary && { color: colors.green }]}>
        {label}
      </Text>
    </Pressable>
  );
}
function Tool({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  onPress(): void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.tool}>
      <Ionicons name={icon} size={23} color={colors.green} />
      <View style={styles.grow}>
        <Text style={styles.toolTitle}>{title}</Text>
        <Text style={styles.caption}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  content: { gap: 18 },
  grow: { flex: 1, minWidth: 0, gap: 5 },
  pressed: { opacity: 0.75 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionIntro: { gap: 7 },
  eyebrow: {
    color: colors.gold,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  heading: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 33,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  body: { color: colors.ink, fontSize: 14, lineHeight: 23 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  subheading: {
    color: colors.ink,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "700",
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#FFF",
    minHeight: 126,
  },
  umrahChoice: { backgroundColor: colors.green, borderColor: colors.green },
  choiceIcon: {
    width: 48,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F1E4",
  },
  choiceTitle: {
    color: colors.ink,
    fontSize: 23,
    lineHeight: 31,
    fontWeight: "700",
  },
  white: { color: "#FFF" },
  onGreen: { color: "#D9E9DE", fontSize: 13, lineHeight: 21 },
  choiceMeta: { color: "#E7CF9F", fontSize: 11, lineHeight: 18 },
  offline: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  change: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.light,
  },
  changeLabel: {
    color: colors.green,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  resume: {
    backgroundColor: colors.green,
    borderRadius: 23,
    padding: 21,
    gap: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#39785D",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: 4, backgroundColor: "#DFC493" },
  resumeTitle: { fontSize: 21, lineHeight: 29, fontWeight: "700" },
  resumeButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF",
    borderRadius: 14,
    minHeight: 49,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resumeLabel: {
    color: colors.green,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },
  search: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 11,
  },
  timelineRow: { flexDirection: "row", gap: 12 },
  rail: { width: 30, alignItems: "center" },
  stepNumber: {
    width: 30,
    height: 30,
    marginTop: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#CFDCCF",
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDone: { backgroundColor: colors.green, borderColor: colors.green },
  numberLabel: { color: colors.green, fontSize: 12, fontWeight: "700" },
  connector: { flex: 1, width: 1, backgroundColor: "#D6DCCB" },
  stage: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
    marginBottom: 12,
    gap: 5,
  },
  stageDate: {
    color: colors.gold,
    fontSize: 11,
    lineHeight: 18,
    fontWeight: "600",
  },
  stageTitle: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "700",
  },
  empty: { gap: 15, paddingVertical: 14 },
  tools: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 23,
    gap: 4,
  },
  tool: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 15,
  },
  toolTitle: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  action: {
    backgroundColor: colors.green,
    minHeight: 50,
    borderRadius: 15,
    padding: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: "#FFF",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  detail: { flex: 1, backgroundColor: colors.paper },
  detailNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  readBadge: {
    fontSize: 10,
    color: colors.green,
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.light,
  },
  detailContent: { padding: 23, gap: 17, paddingBottom: 30 },
  detailTitle: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 39,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  facts: { gap: 7 },
  fact: { flexDirection: "row", alignItems: "center", gap: 8 },
  summary: {
    color: colors.green,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "600",
  },
  instructions: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 21,
    padding: 18,
    gap: 18,
  },
  instruction: { flexDirection: "row", gap: 10 },
  instructionNumber: {
    fontSize: 14,
    lineHeight: 23,
    color: colors.gold,
    fontWeight: "700",
  },
  note: {
    flexDirection: "row",
    gap: 9,
    backgroundColor: "#F3EDDE",
    padding: 16,
    borderRadius: 16,
  },
  noteText: { fontSize: 13, lineHeight: 22, color: "#715D38" },
  sources: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 19,
    gap: 8,
  },
  source: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  sourceTitle: { color: colors.green, fontSize: 13, lineHeight: 21 },
  detailFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
  },
  navButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});
