import puppeteer from 'puppeteer'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdir } from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir  = path.join(__dirname, '..', 'docs', 'product-summary')
const htmlPath = path.join(docsDir, 'index.html')
const outPath  = path.join(docsDir, 'out', 'product-summary.png')

await mkdir(path.dirname(outPath), { recursive: true })

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const page    = await browser.newPage()

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 20000 })
await new Promise(r => setTimeout(r, 1200))

await page.screenshot({ path: outPath, fullPage: true, type: 'png' })
await browser.close()

console.log('Saved:', outPath)
