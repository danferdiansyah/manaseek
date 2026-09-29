import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import puppeteer from 'puppeteer'

// Run the actual Nest app and PostgreSQL, never a mocked checkout response.
// All writes belong to a disposable fixture account/package and are cleaned up.
const apiRoot = resolve(import.meta.dirname, '../../manaseek-api')
const apiRequire = createRequire(resolve(apiRoot, 'package.json'))
apiRequire('dotenv').config({ path: resolve(apiRoot, '.env'), quiet: true })
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL).hostname), 'Use a local migrated database.')
process.env.NODE_ENV = 'test'
process.env.SCHEDULER_ENABLED = 'false'
process.env.PUSH_PROVIDER = 'noop'
apiRequire('reflect-metadata')
const { NestFactory } = apiRequire('@nestjs/core')
const { JwtService } = apiRequire('@nestjs/jwt')
const { PrismaClient } = apiRequire('@prisma/client')
const { AppModule } = apiRequire('./dist/app.module.js')
const prisma = new PrismaClient()
let app, server, browser, user, pkg
try {
  const suffix = randomUUID()
  user = await prisma.user.create({ data: { email: `browser-${suffix}@example.test`, name: 'Jamaah Browser', jamaahProfile: { create: {} } } })
  const seed = await prisma.umrahPackage.findFirstOrThrow({ where: { slug: 'umroh-hemat-9-hari' } })
  pkg = await prisma.umrahPackage.create({ data: {
    slug: `browser-${suffix}`, name: 'Umroh Browser 9 Hari', summary: seed.summary, description: seed.description,
    durationDays: 9, departureCity: 'Jakarta', basePrice: 24900000, tripleSupplement: 1200000, doubleSupplement: 2500000, details: seed.details,
    departures: { create: { departureDate: new Date('2099-01-01'), returnDate: new Date('2099-01-09'), availableSeats: 3 } },
  }, include: { departures: true } })
  app = await NestFactory.create(AppModule, { logger: false })
  app.setGlobalPrefix('api')
  await app.listen(0, '127.0.0.1')
  apiRequire('nestjs-pino').PinoLogger.root.level = 'silent'
  const apiOrigin = await app.getUrl()
  const token = await app.get(JwtService).signAsync({ sub: user.id, role: 'JAMAAH' })
  server = await createServer({ root: resolve(import.meta.dirname, '..'), server: { host: '127.0.0.1', port: 0, proxy: { '/api': { target: apiOrigin, changeOrigin: true } } } })
  await server.listen()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument(accessToken => localStorage.setItem('manaseek.accessToken', accessToken), token)
  const screenshot = async name => {
    await page.evaluate(() => window.scrollTo(0, 0))
    const outputDir = resolve(import.meta.dirname, '../../out')
    await mkdir(outputDir, { recursive: true })
    await page.screenshot({ path: resolve(outputDir, `${name}.png`), fullPage: true })
  }
  const button = async text => {
    const handle = await page.evaluateHandle(label => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === label), text)
    assert.ok(handle.asElement(), `Button ${text} exists`)
    await handle.asElement().click()
    await handle.dispose()
  }
  const checkUmrahNav = async () => {
    assert.equal(await page.$$eval('.app-bottom-nav button', buttons => buttons.length), 6)
    assert.equal(await page.$eval('.app-bottom-nav [aria-current="page"]', button => button.dataset.tab), 'umrah-packages')
  }
  await page.goto(`${origin}/?screen=home`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.app-bottom-nav [data-tab="umrah-packages"]')
  await page.click('.app-bottom-nav [data-tab="umrah-packages"]')
  await page.waitForSelector('.umrah-package-card')
  await checkUmrahNav()
  assert.ok(await page.$$eval('.umrah-package-card', cards => cards.length >= 3))
  const covers = await page.$$eval('.umrah-package-card', cards => cards.filter(card => card.dataset.packageSlug.startsWith('umroh-')).map(card => card.querySelector('.umrah-banner').getAttribute('src')))
  assert.equal(new Set(covers).size, 3, 'Each seeded package has its own destination banner')
  await page.waitForFunction(() => document.querySelector('.umrah-banner')?.naturalWidth > 0)
  await screenshot('umrah-catalog-mobile')
  await page.evaluate(slug => {
    const card = [...document.querySelectorAll('.umrah-package-card')].find(el => el.dataset.packageSlug === slug)
    if (!card) throw new Error(`Missing fixture package ${slug}`)
    card.querySelector('button').click()
  }, pkg.slug)
  await page.waitForSelector('.umrah-room-grid')
  await checkUmrahNav()
  await page.waitForFunction(() => document.querySelector('.umrah-detail-banner img')?.naturalWidth > 0)
  assert.equal(await page.$$eval('.umrah-flight', items => items.length), 2)
  assert.equal(await page.$$eval('.umrah-hotel', items => items.length), 2)
  await page.$eval('.umrah-room-grid', el => el.scrollIntoView({ block: 'center' }))
  await page.click('.umrah-room-grid button:last-child')
  await page.waitForFunction(() => document.querySelector('.umrah-room-grid button:last-child')?.getAttribute('aria-pressed') === 'true')
  await button('Pesan paket')
  await page.waitForSelector('.umrah-checkout form')
  await page.click('[aria-label="Tambah jamaah"]')
  await button('Isi data contoh')
  assert.match(await page.$eval('.umrah-total', el => el.textContent), /54\.800\.000/)
  assert.equal(await page.$eval('button[type="submit"]', el => el.disabled), true)
  await page.click('.umrah-consent input')
  await screenshot('umrah-checkout-mobile')
  await page.click('button[type="submit"]')
  await page.waitForSelector('.umrah-order-code')
  await checkUmrahNav()
  const code = await page.$eval('.umrah-order-code', el => el.textContent)
  let saved = await prisma.umrahOrder.findUniqueOrThrow({ where: { code }, include: { payment: true, travelers: true } })
  assert.equal(saved.totalAmount.toString(), '54800000')
  assert.equal(saved.payment.amount.toString(), '54800000')
  assert.equal(saved.travelers.length, 2)
  assert.equal(saved.payment.method, 'DUMMY')
  assert.equal(saved.payment.status, 'SUCCESS')
  assert.equal((await prisma.umrahDeparture.findUniqueOrThrow({ where: { id: pkg.departures[0].id } })).availableSeats, 1)
  await page.reload({ waitUntil: 'networkidle0' })
  assert.equal(await page.$eval('.umrah-order-code', el => el.textContent), code)
  await screenshot('umrah-receipt-mobile')
  await button('Semua pesanan saya')
  await page.waitForSelector('.umrah-order-card')
  await checkUmrahNav()
  assert.equal(await page.$$eval('.umrah-order-card', items => items.length), 1)
  await page.click('.umrah-order-card')
  await page.waitForSelector('.umrah-order-code')
  await page.click('.umrah-saved-details summary')
  assert.equal(await page.$$eval('.umrah-flight', items => items.length), 2)
  console.log('PASS real checkout: catalog, flights/hotels, room pricing, travelers, payment rows, receipt reload and history')

  // Simulate a lost response AFTER the backend has committed the purchase.
  // Retrying must return the existing order rather than debit seats twice.
  await page.goto(`${origin}/?screen=umrah-checkout&slug=${pkg.slug}&departureId=${pkg.departures[0].id}&roomType=QUAD`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.umrah-checkout form')
  await button('Isi data contoh')
  await page.click('.umrah-consent input')
  await page.evaluate(() => {
    const nativeFetch = window.fetch
    let fail = true
    window.fetch = async (...args) => {
      const response = await nativeFetch(...args)
      if (fail && String(args[0]).endsWith('/umrah/orders') && args[1]?.method === 'POST') {
        fail = false
        await response.text()
        throw new TypeError('Simulated response lost after commit')
      }
      return response
    }
  })
  await page.click('button[type="submit"]')
  await page.waitForSelector('.umrah-form-error')
  assert.equal(await page.$eval('fieldset', el => el.disabled), true)
  await page.click('button[type="submit"]')
  await page.waitForSelector('.umrah-order-code')
  assert.equal(await prisma.umrahOrder.count({ where: { userId: user.id } }), 2)
  assert.equal((await prisma.umrahDeparture.findUniqueOrThrow({ where: { id: pkg.departures[0].id } })).availableSeats, 0)
  saved = await prisma.umrahOrder.findFirstOrThrow({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
  assert.equal(await prisma.umrahPayment.count({ where: { order: { userId: user.id } } }), 2)
  console.log('PASS retry after lost payment response creates no duplicate order/payment')

  // Route authentication, owner-only receipts and strict input validation.
  assert.equal((await fetch(`${apiOrigin}/api/umrah/orders`)).status, 401)
  const otherToken = await app.get(JwtService).signAsync({ sub: randomUUID(), role: 'JAMAAH' })
  assert.equal((await fetch(`${apiOrigin}/api/umrah/orders/${saved.id}`, { headers: { authorization: `Bearer ${otherToken}` } })).status, 404)
  assert.equal((await fetch(`${apiOrigin}/api/umrah/orders`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ totalAmount: 1, paymentStatus: 'SUCCESS' }) })).status, 400)
  for (const screen of ['umrah-packages', `umrah-package&slug=${pkg.slug}`, `umrah-checkout&slug=${pkg.slug}`, 'umrah-orders']) {
    await page.goto(`${origin}/?screen=${screen}`, { waitUntil: 'networkidle0' })
    for (const width of [320, 390, 420]) {
      await page.setViewport({ width, height: 844 })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No overflow: ${screen}, ${width}px`)
      if (!screen.startsWith('umrah-checkout')) {
        await checkUmrahNav()
        assert.equal(await page.$$eval('.app-bottom-nav button', buttons => buttons.every(button => button.getBoundingClientRect().width >= 44)), true, `Navigation touch targets at ${width}px`)
      }
    }
    if (screen.startsWith('umrah-package&')) assert.equal(await page.$eval('.umrah-action button', el => el.disabled), true)
  }
  assert.deepEqual(errors, [])
  console.log('PASS sold-out state, HTTP authorization/validation, dedicated Umroh tab, varied banners, mobile layouts and no browser errors')
} finally {
  await browser?.close()
  await server?.close()
  await app?.close()
  if (user) await prisma.umrahOrder.deleteMany({ where: { userId: user.id } })
  if (pkg) {
    await prisma.umrahDeparture.deleteMany({ where: { packageId: pkg.id } })
    await prisma.umrahPackage.delete({ where: { id: pkg.id } })
  }
  if (user) await prisma.user.delete({ where: { id: user.id } })
  await prisma.$disconnect()
}
