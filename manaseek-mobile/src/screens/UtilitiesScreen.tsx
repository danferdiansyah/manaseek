import { useState } from "react";
import { Text, View } from "react-native";
import { useIsFocused } from "expo-router";
import {
  Body,
  Button,
  Card,
  Choice,
  Field,
  Notice,
  Page,
  Title,
  colors,
  s,
} from "../components/ui";
import { LocationPicker } from "../components/LocationPicker";
import { useHeading, usePosition } from "../lib/location";
import {
  compassPoint,
  distanceToKaabaKm,
  qiblaBearing,
} from "../../../packages/shared/qibla.js";
import {
  RATE_DATE,
  SAR_IDR_RATE,
  convertAmount,
  formatAmount,
  parseAmount,
  validConversion,
} from "../../../packages/shared/currency.js";

export function QiblaScreen() {
  const location = usePosition();
  const focused = useIsFocused();
  const { heading, accuracy } = useHeading(
    focused && Boolean(location.position),
  );
  const bearing = location.position ? qiblaBearing(location.position) : null;
  const near = location.position
    ? distanceToKaabaKm(location.position) < 1
    : false;
  return (
    <Page
      title="Menghadap dengan tenang"
      subtitle="Arah kiblat dihitung langsung di perangkat."
      back
    >
      <Card>
        <LocationPicker location={location} />
      </Card>
      {bearing !== null ? (
        <Card style={{ alignItems: "center", paddingVertical: 32 }}>
          {near ? (
            <Body>
              Kamu berada dekat Ka’bah. Ikuti arah bangunan Ka’bah dan saf
              setempat.
            </Body>
          ) : (
            <>
              <View
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 110,
                  borderWidth: 2,
                  borderColor: colors.line,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: colors.light,
                }}
              >
                <Text
                  style={{ position: "absolute", top: 15, color: colors.green }}
                >
                  UTARA
                </Text>
                <Text
                  accessibilityLabel={`Arah kiblat ${Math.round(bearing)} derajat`}
                  style={{
                    fontSize: 92,
                    color: colors.green,
                    transform: [{ rotate: `${bearing - (heading ?? 0)}deg` }],
                  }}
                >
                  ↑
                </Text>
              </View>
              <Title>
                {Math.round(bearing)}° · {compassPoint(bearing)}
              </Title>
              <Body muted>
                {heading === null
                  ? "Arah dari utara sejati. Cocokkan secara manual dengan kompas yang sudah dikalibrasi."
                  : "Arah panah mengikuti orientasi ponsel."}
              </Body>
              {heading !== null && accuracy < 2 ? (
                <Notice>
                  Akurasi kompas rendah. Jauhkan dari logam dan gerakkan ponsel
                  membentuk angka delapan.
                </Notice>
              ) : null}
            </>
          )}
        </Card>
      ) : null}
    </Page>
  );
}
export function CurrencyScreen() {
  const [from, setFrom] = useState<"SAR" | "IDR">("SAR");
  const [input, setInput] = useState("100");
  const value = parseAmount(input);
  const converted = value === null ? null : convertAmount(value, from);
  const valid =
    value !== null && converted !== null && validConversion(value, converted);
  const target = from === "SAR" ? "IDR" : "SAR";
  return (
    <Page
      title="Riyal ↔ Rupiah"
      subtitle="Perhitungan praktis, tetap tersedia tanpa internet."
      back
    >
      <Card>
        <View style={s.row}>
          <Choice
            label="Dari Riyal"
            selected={from === "SAR"}
            onPress={() => setFrom("SAR")}
          />
          <Choice
            label="Dari Rupiah"
            selected={from === "IDR"}
            onPress={() => setFrom("IDR")}
          />
        </View>
        <Field
          label={`Nominal ${from}`}
          keyboardType="decimal-pad"
          value={input}
          onChangeText={setInput}
        />
        <Body muted>Perkiraan dalam {target}</Body>
        <Text style={{ fontSize: 32, fontWeight: "700", color: colors.green }}>
          {valid
            ? `${target === "IDR" ? "Rp" : "SAR "}${formatAmount(converted!, target === "IDR" ? 0 : 2)}`
            : "—"}
        </Text>
        {value !== null && !valid ? (
          <Notice error>
            Masukkan nominal yang valid dan tidak terlalu besar.
          </Notice>
        ) : null}
        <Button
          title="Tukar arah konversi"
          secondary
          onPress={() => {
            if (valid) setInput(formatAmount(converted!, 2));
            setFrom(target);
          }}
        />
        <View style={[s.row, { flexWrap: "wrap" }]}>
          {(from === "SAR" ? [10, 50, 100, 500] : [50000, 100000, 500000]).map(
            (n) => (
              <Choice
                key={n}
                label={formatAmount(n, 0)}
                selected={value === n}
                onPress={() => setInput(String(n))}
              />
            ),
          )}
        </View>
      </Card>
      <Notice>
        Kurs tetap per {RATE_DATE}: 1 SAR = Rp
        {formatAmount(SAR_IDR_RATE.idrPerSar)}. Acuan {SAR_IDR_RATE.sourceName};
        kurs transaksi bisa berbeda dan tidak diperbarui otomatis.
      </Notice>
    </Page>
  );
}
