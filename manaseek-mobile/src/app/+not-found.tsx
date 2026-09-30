import { router } from "expo-router";
import { Body, Button, Page } from "../components/ui";
export default function NotFound() {
  return (
    <Page title="Halaman tidak ditemukan" back>
      <Body>Halaman ini mungkin sudah berpindah.</Body>
      <Button title="Kembali ke beranda" onPress={() => router.replace("/")} />
    </Page>
  );
}
