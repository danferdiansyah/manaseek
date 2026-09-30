import { useState } from "react";
import { router } from "expo-router";
import {
  AccountGate,
  Body,
  Button,
  Card,
  Notice,
  Page,
  ResourceState,
  Title,
} from "../components/ui";
import { useAuth } from "../lib/auth";
import { useResource } from "../lib/resource";
import { bookingFromNotification, registerPush } from "../lib/push";
import { errorMessage } from "../lib/api";
import { Pagination } from "./BookingScreen";
import type { Notification, Page as ApiPage } from "../lib/models";

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const resource = useResource<ApiPage<Notification>>(
    `/notifications?page=${page}&limit=20`,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function enable() {
    if (!user || busy) return;
    setBusy(true);
    try {
      await registerPush(user.id, true);
      setMessage("Notifikasi perangkat berhasil diaktifkan.");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Kabar perjalananmu"
      back
      onRefresh={resource.reload}
      refreshing={resource.loading && !!resource.data}
    >
      <AccountGate>
        <Button
          title="Aktifkan notifikasi perangkat"
          busy={busy}
          secondary
          onPress={() => {
            void enable();
          }}
        />
        {message ? <Notice>{message}</Notice> : null}
        <ResourceState
          resource={resource}
          empty={!resource.data?.items.length}
        />
        {resource.data?.items.map((item) => {
          const id = bookingFromNotification(item.data ?? {});
          return (
            <Card key={item.id}>
              <Title>{item.title}</Title>
              <Body>{item.body}</Body>
              <Body muted>
                {new Date(item.createdAt).toLocaleString("id-ID")}
              </Body>
              {id ? (
                <Button
                  title="Lihat pendampingan"
                  secondary
                  onPress={() =>
                    router.push({ pathname: "/bookings/[id]", params: { id } })
                  }
                />
              ) : null}
            </Card>
          );
        })}
        <Pagination
          page={page}
          total={resource.data?.meta.totalPages ?? 1}
          onChange={setPage}
        />
      </AccountGate>
    </Page>
  );
}
