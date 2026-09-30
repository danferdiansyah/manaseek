import { View } from "react-native";
import { Body, Card, Notice, Title } from "./ui";
import type { PackageDetails as Details } from "../lib/models";

export function DemoNotice() {
  return (
    <Notice>
      Paket & pembayaran simulasi. Tidak ada dana ditagihkan atau tiket
      sungguhan diterbitkan.
    </Notice>
  );
}
export function PackageDetails({ details }: { details: Details }) {
  return (
    <>
      <Card>
        <Title>Penerbangan pergi–pulang</Title>
        {details.flights.map((f) => (
          <View key={f.direction} style={{ gap: 5, paddingVertical: 8 }}>
            <Title>
              {f.direction === "OUTBOUND" ? "Keberangkatan" : "Kepulangan"}
            </Title>
            <Body>
              {f.airline} · {f.flightNumber}
            </Body>
            <Body>
              {f.from} {f.departureTime} → {f.to} {f.arrivalTime}
            </Body>
            <Body muted>
              {f.cabin} · {f.transit} · {f.baggage}
            </Body>
          </View>
        ))}
      </Card>
      <Card>
        <Title>Hotel selama perjalanan</Title>
        {details.hotels.map((h) => (
          <View key={h.city} style={{ gap: 5, paddingVertical: 8 }}>
            <Title>
              {h.name} {"★".repeat(h.stars)}
            </Title>
            <Body>
              {h.city} · {h.nights} malam
            </Body>
            <Body muted>
              ±{h.distanceMeters} m dari {h.landmark} · {h.mealPlan}
            </Body>
          </View>
        ))}
      </Card>
      <Card>
        <Title>Sudah termasuk</Title>
        {details.included.map((item) => (
          <Body key={item}>✓ {item}</Body>
        ))}
        <Title>Belum termasuk</Title>
        {details.excluded.map((item) => (
          <Body muted key={item}>
            • {item}
          </Body>
        ))}
      </Card>
      <Card>
        <Title>Rencana perjalanan</Title>
        {details.itinerary.map((item) => (
          <View key={item.days} style={{ gap: 5, paddingVertical: 8 }}>
            <Body muted>{item.days}</Body>
            <Title>{item.title}</Title>
            <Body>{item.description}</Body>
          </View>
        ))}
      </Card>
    </>
  );
}
