import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const OUT_DIR = '/Users/danferdiansyah/Development/manaseek/out'
const BASE    = 'http://localhost:5174'

const screens = [
  { id: 'splash',           label: '01_splash' },
  { id: 'home',             label: '02_home' },
  { id: 'guidance',         label: '03_guidance' },
  { id: 'guidance-detail',  label: '04_guidance_detail' },
  { id: 'chatbot',          label: '05_chatbot' },
  { id: 'mutawif',          label: '06_mutawif_list' },
  { id: 'mutawif-profile',  label: '07_mutawif_profile' },
  { id: 'booking',          label: '08_booking' },
  { id: 'booking-success',  label: '09_booking_success' },
  { id: 'profile',          label: '10_profile' },
  { id: 'esim',             label: '11_esim' },
]

fs.mkdirSync(OUT_DIR, { recursive: true })

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const page    = await browser.newPage()

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })

for (const { id, label } of screens) {
  // mutawif list has an OSM iframe — give it more time to render tiles
  const extraWait = id === 'mutawif' ? 4000 : 700

  await page.goto(`${BASE}?screen=${id}&capture=1`, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, extraWait))

  const outPath = path.join(OUT_DIR, `${label}.png`)
  await page.screenshot({ path: outPath, fullPage: true, type: 'png' })
  console.log(`  saved → ${outPath}`)
}

await browser.close()
console.log('\nDone. Screenshots saved to:', OUT_DIR)
