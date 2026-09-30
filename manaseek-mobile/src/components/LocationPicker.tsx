import { View } from "react-native";
import { Body, Button, Choice, Notice, s } from "./ui";
import { usePosition } from "../lib/location";

export function LocationPicker({
  location,
}: {
  location: ReturnType<typeof usePosition>;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Body muted>
        {location.position
          ? `${location.position.label} · ${location.position.latitude.toFixed(3)}, ${location.position.longitude.toFixed(3)}`
          : "Pilih lokasi untuk perhitungan dan pencarian."}
      </Body>
      {location.error ? <Notice>{location.error}</Notice> : null}
      <Button
        title="Gunakan lokasi perangkat"
        secondary
        busy={location.busy}
        onPress={() => {
          void location.refresh();
        }}
      />
      <View style={[s.row, { flexWrap: "wrap" }]}>
        {[
          ["Makkah", 21.4225, 39.8262],
          ["Madinah", 24.4672, 39.6111],
          ["Jakarta", -6.2088, 106.8456],
        ].map(([name, lat, lon]) => (
          <Choice
            key={String(name)}
            label={String(name)}
            selected={location.position?.label === name}
            onPress={() =>
              location.select(Number(lat), Number(lon), String(name))
            }
          />
        ))}
      </View>
    </View>
  );
}
