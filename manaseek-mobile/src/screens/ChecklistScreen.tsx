import { useEffect, useMemo, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import {
  AccountGate,
  Body,
  Button,
  Card,
  Notice,
  Page,
  Title,
  colors,
  s,
} from "../components/ui";
import { useAuth } from "../lib/auth";
import { api, errorMessage } from "../lib/api";
import { storage } from "../lib/storage";
import { ChecklistSync, type ChecklistSnapshot } from "../lib/checklist-sync";
import type { Checklist } from "../lib/models";

export default function ChecklistScreen() {
  const { user } = useAuth();
  return (
    <Page
      title="Siap melangkah"
      subtitle="Persiapan kecil untuk perjalanan yang lebih tenang."
      back
    >
      <AccountGate>
        {user ? <ChecklistContent key={user.id} id={user.id} /> : null}
      </AccountGate>
    </Page>
  );
}
function ChecklistContent({ id }: { id: string }) {
  const [state, setState] = useState<ChecklistSnapshot>({
    data: null,
    pending: {},
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const queue = useMemo(
    () =>
      new ChecklistSync(
        {
          read: () => storage.get(`user:${id}:checklist`),
          write: (value) => storage.set(`user:${id}:checklist`, value),
        },
        (itemId, completed) =>
          api.put<Checklist>(`/content/checklist/${itemId}`, { completed }),
      ),
    [id],
  );
  useEffect(() => {
    let active = true;
    const version = api.sessionVersion;
    const current = () => active && api.sessionVersion === version;
    const unsubscribe = queue.subscribe((value) => {
      if (current()) setState({ ...value });
    });
    const sync = async () => {
      if (!current()) return;
      try {
        await queue.sync(current);
        if (!current()) return;
        const data = await api.get<Checklist>("/content/checklist");
        if (current()) {
          await queue.replace(data);
          setMessage(null);
        }
      } catch (e) {
        if (current()) setMessage(errorMessage(e));
      }
    };
    const loaded = queue.load();
    void loaded.then(sync).catch((e) => setMessage(errorMessage(e)));
    const network = NetInfo.addEventListener((n) => {
      if (n.isConnected && n.isInternetReachable)
        void loaded.then(sync).catch(() => {});
    });
    const listener = AppState.addEventListener("change", (v) => {
      if (v === "active") void sync();
    });
    return () => {
      active = false;
      network();
      listener.remove();
      unsubscribe();
    };
  }, [queue]);
  async function tick(itemId: string, completed: boolean) {
    if (busy) return;
    setBusy(true);
    const version = api.sessionVersion;
    try {
      await queue.tick(itemId, completed, Crypto.randomUUID());
      try {
        const network = await NetInfo.fetch();
        if (
          network.isConnected === false ||
          network.isInternetReachable === false
        )
          throw new Error("offline");
        await queue.sync(() => api.sessionVersion === version);
        setMessage(null);
      } catch {
        setMessage(
          "Perubahan disimpan di perangkat dan akan dikirim ketika koneksi kembali.",
        );
      }
    } catch (error) {
      setMessage(
        `Perubahan belum dapat disimpan di perangkat. ${errorMessage(error)}`,
      );
    } finally {
      setBusy(false);
    }
  }
  const items = state.data?.items ?? [];
  const isDone = (item: Checklist["items"][number]) =>
    state.pending[item.id]?.completed ?? item.completed;
  return (
    <>
      <Card>
        <Title>
          {items.filter(isDone).length} dari {items.length} persiapan selesai
        </Title>
        <Body muted>
          {Object.keys(state.pending).length
            ? `${Object.keys(state.pending).length} perubahan menunggu sinkronisasi.`
            : "Progres tersimpan untuk akunmu."}
        </Body>
      </Card>
      {message ? <Notice>{message}</Notice> : null}
      {!state.data ? (
        <Button
          title="Muat checklist"
          onPress={() => {
            void api
              .get<Checklist>("/content/checklist")
              .then((data) => queue.replace(data))
              .catch((e) => setMessage(errorMessage(e)));
          }}
          secondary
        />
      ) : null}
      {items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone(item), disabled: busy }}
          disabled={busy}
          onPress={() => {
            void tick(item.id, !isDone(item));
          }}
          style={[s.card, s.row]}
        >
          <Text style={{ fontSize: 25, color: colors.green }}>
            {isDone(item) ? "☑" : "☐"}
          </Text>
          <View style={{ flex: 1, gap: 4 }}>
            <Title>{item.title}</Title>
            {item.description ? <Body muted>{item.description}</Body> : null}
          </View>
        </Pressable>
      ))}
    </>
  );
}
