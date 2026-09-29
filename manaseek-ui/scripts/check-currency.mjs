import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import puppeteer from 'puppeteer'
import { convertAmount, formatAmount, parseAmount, RATE_DATE, RATE_TIME, validConversion } from '../src/lib/currency.js'

assert.equal(convertAmount(100, 'SAR'), 480330)
assert.equal(convertAmount(480330, 'IDR'), 100)
assert.equal(formatAmount(convertAmount(10.5, 'SAR')), '50.434,65')
assert.equal(RATE_DATE, '29 September 2026')
assert.equal(RATE_TIME, '07.55')
for (const [input, expected] of [['1.000', 1000], ['1.234.567,89', 1234567.89], ['10,50', 10.5], ['10.50', 10.5], [',50', 0.5], ['0', 0], ['', null]]) {
  assert.equal(parseAmount(input), expected, input)
}
for (const input of ['-10', '1e3', 'abc', '1.23.45', '10,123', 'Infinity']) assert.ok(Number.isNaN(parseAmount(input)), input)
assert.equal(validConversion(1e20, convertAmount(1e20, 'SAR')), false)

const server = await createServer({ root: resolve(import.meta.dirname, '..'), server: { host: '127.0.0.1', port: 0 } })
let browser
try {
  await server.listen()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const browserErrors = []
  const requests = []
  page.on('pageerror', error => browserErrors.push(error.message))
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument(() => localStorage.setItem('manaseek.accessToken', 'fixture-token'))
  await page.setRequestInterception(true)
  page.on('request', request => {
    const url = new URL(request.url())
    if (!url.pathname.startsWith('/api/')) return request.continue()
    requests.push(url.pathname)
    const body = url.pathname === '/api/auth/me'
      ? { id: 'fixture-user', name: 'Jamaah', role: 'JAMAAH', needsOnboarding: false }
      : { items: [], meta: { total: 0 } }
    return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  const output = () => page.$eval('output', element => element.textContent)
  const fill = async text => {
    await page.$eval('#currency-amount', element => element.select())
    await page.keyboard.press('Backspace')
    if (text) await page.type('#currency-amount', text)
  }
  await page.goto(`${origin}/?screen=home`, { waitUntil: 'networkidle0' })
  await page.click('.currency-entry')
  await page.waitForSelector('#currency-amount')
  assert.equal(await output(), 'Rp 480.330,00')
  assert.match(await page.$eval('.currency-source', element => element.textContent), /29 September 2026, 07.55 WIB/)

  // Conversion is local and keeps working without an exchange-rate request.
  const requestsBefore = requests.length
  await page.setOfflineMode(true)
  await fill('10,50')
  assert.equal(await output(), 'Rp 50.434,65')
  await page.click('[aria-label="Tukar arah konversi"]')
  assert.equal(await page.$eval('#currency-amount', element => element.value), '50.434,65')
  assert.equal(await output(), '﷼ 10,50')
  await fill('480.330')
  assert.equal(await output(), '﷼ 100,00')
  await page.click('[aria-label="Tukar arah konversi"]')
  await page.click('.currency-presets button:last-child')
  assert.equal(await output(), 'Rp 2.401.650,00')
  await fill('0')
  assert.equal(await output(), 'Rp 0,00')
  await fill('')
  assert.equal(await output(), '—')
  for (const value of ['-5', '1e3', '1,234', '999999999999999999']) {
    await fill(value)
    assert.equal(await page.$eval('#currency-amount', element => element.getAttribute('aria-invalid')), 'true')
    assert.equal(await output(), '—')
  }
  await fill('100')
  assert.equal(await page.$eval('#currency-amount', element => element.getAttribute('aria-invalid')), 'false')
  assert.equal(requests.length, requestsBefore)
  await page.setOfflineMode(false)

  for (const width of [320, 390, 420]) {
    await page.setViewport({ width, height: 844, deviceScaleFactor: 1 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No overflow at ${width}px`)
  }
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0) })
  const outDir = resolve(import.meta.dirname, '../../out')
  await mkdir(outDir, { recursive: true })
  await page.screenshot({ path: resolve(outDir, 'currency-mobile.png'), fullPage: true })
  await page.click('[aria-label="Kembali"]')
  await page.waitForSelector('.currency-entry')
  assert.deepEqual(browserErrors, [])
  console.log('Currency checks passed: locale parsing, both directions, swaps, presets, validation, offline conversion, mobile widths and home navigation.')
} finally {
  await browser?.close()
  await server.close()
}
