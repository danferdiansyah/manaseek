import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const user = {
  id: id(1),
  name: "Ahmad Fixture",
  email: "ahmad@manaseek.test",
  phone: "+628123456789",
  role: "JAMAAH",
  needsOnboarding: false,
  permissions: { aiChat: true },
};
const topic = {
  id: id(2),
  slug: "ihram",
  title: "Persiapan ihram",
  summary: "Panduan persiapan perjalanan.",
  categories: ["UMRAH"],
  phase: "IHRAM",
  obligation: "RUKUN",
  readingMinutes: 3,
  status: "DRAFT",
  steps: [{ id: id(3), text: "Langkah panduan dari API fixture." }],
  prayers: [],
  references: [
    {
      id: id(4),
      citation: "Rujukan fixture",
      gloss: "Contoh rujukan",
      verifiedAt: null,
    },
  ],
  prohibitions: [],
  next: null,
};
const prayer = {
  id: id(5),
  title: "Doa perjalanan",
  arabic: "بِسْمِ اللَّهِ",
  transliteration: "Bismillah",
  translation: "Dengan nama Allah.",
};
let checked = false;
const checklist = () => ({
  items: [
    {
      id: id(6),
      title: "Siapkan paspor",
      description: "Periksa masa berlaku.",
      category: "DOCUMENT",
      completed: checked,
    },
  ],
  meta: { total: 1, completed: Number(checked) },
});
const details = {
  flights: [
    {
      direction: "OUTBOUND",
      airline: "Maskapai demo",
      flightNumber: "DEMO1",
      from: "CGK",
      to: "JED",
      departureTime: "08:00",
      arrivalTime: "14:00",
      cabin: "Ekonomi",
      transit: "Langsung",
      baggage: "30 kg",
    },
  ],
  hotels: [
    {
      city: "Makkah",
      name: "Hotel demo",
      nights: 7,
      stars: 3,
      distanceMeters: 500,
      landmark: "Masjidil Haram",
      mealPlan: "3 kali sehari",
    },
  ],
  included: ["Visa demo"],
  excluded: ["Keperluan pribadi"],
  itinerary: [
    {
      days: "Hari 1",
      title: "Berangkat",
      description: "Perjalanan menuju Jeddah.",
    },
  ],
};
const pkg = {
  id: id(7),
  slug: "umroh-fixture",
  name: "Umroh Fixture 9 Hari",
  summary: "Paket pengujian.",
  durationDays: 9,
  departureCity: "Jakarta",
  basePrice: "25000000",
  tripleSupplement: "1500000",
  doubleSupplement: "3000000",
  details,
  departures: [
    {
      id: id(8),
      departureDate: "2030-11-01T00:00:00Z",
      returnDate: "2030-11-09T00:00:00Z",
      availableSeats: 10,
    },
  ],
};
const m = {
  id: id(10),
  name: "Hasan Fixture",
  user: { name: "Hasan Fixture" },
  bio: "Pendamping ibadah berpengalaman.",
  city: "Makkah",
  languages: ["id", "ar"],
  yearsExperience: 5,
  ratingAverage: 5,
  ratingCount: 1,
  distanceKm: 1.2,
  hourlyRate: 300000,
  rates: [{ serviceType: "IBADAH_GUIDANCE", hourlyRate: "300000" }],
  availabilityStatus: "ONLINE",
  verificationStatus: "APPROVED",
};
let booking;
let order;
const submitted = [];
const sessions = [
  {
    id: id(20),
    title: "Percakapan tersimpan",
    preview: "Jawaban sebelumnya",
    updatedAt: new Date().toISOString(),
    messageCount: 1,
  },
];
const messages = new Map([
  [
    id(20),
    [
      {
        id: id(21),
        role: "ASSISTANT",
        content: "Jawaban sebelumnya dari riwayat.",
        citedSlugs: ["ihram"],
        escalated: false,
        createdAt: new Date().toISOString(),
      },
    ],
  ],
]);
const pageOf = (items) => ({
  items,
  meta: { page: 1, limit: 20, total: items.length, totalPages: 1 },
});
let offlineApi = false;
let child;
let browser;
let output = "";
const fixture = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  );
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") {
    res.end();
    return;
  }
  const reply = (value, status = 200) => {
    res.statusCode = status;
    res.end(JSON.stringify(value));
  };
  if (offlineApi) {
    reply({ error: { code: "UNAVAILABLE", message: "Offline fixture" } }, 503);
    return;
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  const data = body ? JSON.parse(body) : {};
  const path = new URL(req.url, "http://localhost").pathname.replace(
    /^\/api/,
    "",
  );
  if (path === "/auth/dev-login")
    return reply({
      accessToken: "fixture-access",
      refreshToken: "fixture-refresh",
      user,
    });
  if (path === "/auth/me") return reply(user);
  if (path === "/content/topics")
    return reply({ items: [topic], meta: { total: 1, publishedCount: 0 } });
  if (path === "/content/topics/ihram") return reply(topic);
  if (path === "/content/prayers") return reply([prayer]);
  if (path.startsWith("/content/checklist")) {
    if (req.method === "PUT") checked = data.completed;
    return reply(checklist());
  }
  if (path === "/chat/sessions") return reply(pageOf(sessions));
  const chat = path.match(/^\/chat\/sessions\/(.+)\/messages$/);
  if (chat) return reply(pageOf(messages.get(chat[1]) ?? []));
  if (path === "/chat/messages") {
    const sessionId = data.sessionId ?? id(22);
    const userMessage = {
      id: id(23),
      role: "USER",
      content: data.text,
      citedSlugs: [],
      escalated: false,
      createdAt: new Date().toISOString(),
    };
    const message = {
      ...userMessage,
      id: id(24),
      role: "ASSISTANT",
      content: "Jawaban baru dengan rujukan.",
      citedSlugs: ["ihram"],
    };
    messages.set(sessionId, [
      ...(messages.get(sessionId) ?? []),
      userMessage,
      message,
    ]);
    return reply({ sessionId, userMessage, message });
  }
  if (path === "/mutawif/nearby") return reply([m]);
  if (path === `/mutawif/${m.id}`) return reply(m);
  if (path === "/reviews") return reply(pageOf([]));
  if (path === "/bookings" && req.method === "POST") {
    booking = {
      ...data,
      id: id(30),
      code: "BOOK-FIXTURE",
      status: "REQUESTED",
      totalAmount: "600000",
      mutawif: { user: m.user },
      events: [],
    };
    return reply(booking);
  }
  if (path === "/bookings") return reply(pageOf(booking ? [booking] : []));
  if (path === `/bookings/${id(30)}`) return reply(booking);
  if (path === "/umrah/packages") return reply({ items: [pkg] });
  if (path === "/umrah/packages/umroh-fixture") return reply(pkg);
  if (path === "/umrah/orders" && req.method === "POST") {
    submitted.push(body);
    if (!order) {
      order = {
        id: id(31),
        code: "UMR-FIXTURE",
        status: "CONFIRMED",
        roomType: data.roomType,
        travelerCount: data.travelers.length,
        unitPrice: pkg.basePrice,
        totalAmount: pkg.basePrice,
        createdAt: new Date().toISOString(),
        contactName: data.contactName,
        packageSnapshot: {
          name: pkg.name,
          durationDays: 9,
          departureDate: pkg.departures[0].departureDate,
          returnDate: pkg.departures[0].returnDate,
          details,
        },
        travelers: data.travelers,
        payment: {
          status: "SUCCESS",
          reference: "DEMO-FIXTURE",
          amount: pkg.basePrice,
        },
      };
      return reply(
        {
          error: {
            code: "UNAVAILABLE",
            message: "Respons pembayaran terputus.",
          },
        },
        503,
      );
    }
    assert.equal(submitted.at(-1), submitted[0]);
    return reply(order);
  }
  if (path === "/umrah/orders") return reply(pageOf(order ? [order] : []));
  if (path === `/umrah/orders/${id(31)}`) return reply(order);
  if (path === "/users/me/profile")
    return reply({ city: "Jakarta", mobilityNeed: "NONE" });
  if (path === "/users/me/documents" || path === "/users/me/trips")
    return reply([]);
  if (path === "/notifications") return reply(pageOf([]));
  return reply(
    {
      error: {
        code: "NOT_FOUND",
        message: `Missing fixture ${req.method} ${path}`,
      },
    },
    404,
  );
});
async function freePort() {
  const s = createServer();
  s.listen(0, "127.0.0.1");
  await once(s, "listening");
  const port = s.address().port;
  await new Promise((r) => s.close(r));
  return port;
}
const stage = (title) => console.log(`Preview: ${title}`);
try {
  fixture.listen(Number(process.env.MOBILE_FIXTURE_PORT ?? 0), "127.0.0.1");
  await once(fixture, "listening");
  const apiPort = fixture.address().port;
  const webPort = await freePort();
  const base = process.env.MOBILE_PREVIEW_URL ?? `http://127.0.0.1:${webPort}`;
  if (!process.env.MOBILE_PREVIEW_URL) {
    child = spawn(
      process.execPath,
      [
        "node_modules/expo/bin/cli",
        "start",
        "--web",
        "--port",
        String(webPort),
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          CI: "1",
          EXPO_NO_DOTENV: "1",
          EXPO_PUBLIC_API_URL: `http://127.0.0.1:${apiPort}/api`,
          EXPO_PUBLIC_DEV_LOGIN: "true",
        },
        detached: process.platform !== "win32",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    child.stdout.on("data", (data) => {
      output += data;
    });
    child.stderr.on("data", (data) => {
      output += data;
    });
  }
  for (let n = 0; n < 120; n++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
    if (n === 119) throw new Error("Preview server timed out");
  }
  const executablePath =
    process.env.CHROME_BIN ||
    [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium",
    ].find(existsSync);
  assert.ok(
    executablePath,
    "Set CHROME_BIN to the installed Chrome/Chromium executable.",
  );
  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on(
    "requestfailed",
    (req) =>
      req.failure()?.errorText !== "net::ERR_ABORTED" &&
      console.error(
        "Preview request failed:",
        req.url().split("?")[0],
        req.failure()?.errorText,
      ),
  );
  const text = async (value) =>
    page.waitForFunction(
      (value) => document.body.innerText.includes(value),
      { timeout: 25000 },
      value,
    );
  const click = async (value, exact = false) => {
    await page.waitForFunction(
      (v, exact) =>
        [
          ...document.querySelectorAll('[role="button"],[role="tab"],button,a'),
        ].some(
          (e) =>
            e.getClientRects().length &&
            !e.closest('[aria-hidden="true"]') &&
            getComputedStyle(e).visibility !== "hidden" &&
            (exact
              ? e.innerText.trim().split("\n").at(-1) === v
              : (e.innerText.includes(v) || e.getAttribute("aria-label") === v)),
        ),
      {},
      value,
      exact,
    );
    await page.evaluate(
      (v, exact) => {
        const el = [
          ...document.querySelectorAll('[role="button"],[role="tab"],button,a'),
        ].find(
          (e) =>
            e.getClientRects().length &&
            !e.closest('[aria-hidden="true"]') &&
            getComputedStyle(e).visibility !== "hidden" &&
            (exact
              ? e.innerText.trim().split("\n").at(-1) === v
              : (e.innerText.includes(v) || e.getAttribute("aria-label") === v)),
        );
        el.click();
      },
      value,
      exact,
    );
  };
  const input = async (label, value) => {
    const selector = `[aria-label="${label}"]`;
    await page.waitForSelector(selector);
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type(selector, value);
  };
  const back = async () => {
    await page.evaluate(() =>
      document.querySelector('[aria-label="Kembali"]').click(),
    );
  };
  stage("guest home and offline calculator");
  await page.goto(base, { waitUntil: "networkidle2" });
  await text("Assalamu");
  await click("Riyal ↔ Rupiah");
  await text("480.330");
  await back();
  await click("Mulai dengan Google");
  await text("Masuk akun pengembangan");
  await click("Masuk akun pengembangan");
  await text("Ahmad");
  stage("guidance download, detail contract and offline cache");
  await click("Panduan ibadah");
  await text("Persiapan ihram");
  await click("Unduh panduan");
  await text("Panduan dan doa tersimpan");
  await click("Persiapan ihram");
  await text("Langkah panduan dari API fixture.");
  await back();
  offlineApi = true;
  await click("Persiapan ihram");
  await text("Mode offline");
  await text("Langkah panduan dari API fixture.");
  offlineApi = false;
  await back();
  await click("Beranda", true);
  await click("Checklist");
  await text("Siapkan paspor");
  await page.click('[role="checkbox"]');
  await text("1 dari 1");
  assert.equal(checked, true);
  await back();
  stage("chat history and continuation");
  await click("Tanya Manaseek");
  await click("Riwayat percakapan");
  await click("Percakapan tersimpan");
  await text("Jawaban sebelumnya dari riwayat.");
  await input("Pertanyaan tentang Islam", "Bagaimana persiapan ihram?");
  await click("Kirim pertanyaan");
  await text("Jawaban baru dengan rujukan.");
  await back();
  stage("nearby search and booking");
  await click("Cari mutawif");
  await click("Makkah", true);
  await text("Hasan Fixture");
  await click("Lihat pendamping");
  await click("Atur pendampingan");
  await click("Ajukan pendampingan");
  await text("BOOK-FIXTURE");
  assert.equal(booking.serviceType, "IBADAH_GUIDANCE");
  await back();
  await back();
  await click("Umroh", true);
  stage("checkout retry after a lost response");
  await text("Umroh Fixture 9 Hari");
  await click("Lihat paket dan jadwal");
  await click("Pilih jadwal dan pesan");
  await input("Tanggal lahir jamaah 1 (YYYY-MM-DD)", "1990-01-01");
  await click("Saya memahami");
  await click("Pesan dan bayar simulasi");
  await text("Lanjutkan permintaan sebelumnya");
  await click("Periksa dan lanjutkan pesanan");
  await text("UMR-FIXTURE");
  assert.equal(submitted.length, 2);
  assert.equal(submitted[0], submitted[1]);
  mkdirSync("out", { recursive: true });
  await page.screenshot({ path: "out/preview-order.png", fullPage: true });
  for (const width of [320, 390, 420]) {
    await page.setViewport({ width, height: 844, deviceScaleFactor: 1 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    assert.equal(overflow, false, `Horizontal page overflow at ${width}px`);
  }
  assert.deepEqual(errors, []);
  stage(
    "passed: navigation, offline content, checklist, history, booking, checkout recovery and narrow layouts",
  );
} catch (error) {
  if (browser) {
    const pages = await browser.pages();
    const page = pages.at(-1);
    mkdirSync("out", { recursive: true });
    await page
      .screenshot({ path: "out/preview-failure.png", fullPage: true })
      .catch(() => {});
    writeFileSync(
      "out/preview-failure.txt",
      await page.evaluate(() => document.body.innerText).catch(() => ""),
    );
  }
  console.error(output.slice(-5000));
  throw error;
} finally {
  await browser?.close();
  fixture.closeAllConnections();
  await new Promise((r) => fixture.close(r));
  if (child) {
    try {
      process.kill(
        process.platform === "win32" ? child.pid : -child.pid,
        "SIGTERM",
      );
    } catch {}
  }
}
