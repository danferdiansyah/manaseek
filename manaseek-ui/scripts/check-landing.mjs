import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import puppeteer from 'puppeteer'

// Every authentication response is local to this browser check. No real
// Google account, backend, location, or credentials are used.
const server = await createServer({
  root: resolve(import.meta.dirname, '..'),
  define: { 'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify('landing-fixture') },
  server: { host: '127.0.0.1', port: 0 },
})
let browser
try {
  await server.listen()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  const errors = []
  const requests = []
  let user = { id: 'fixture-user', name: 'Jamaah Uji', email: 'jamaah@example.test', role: 'JAMAAH', needsOnboarding: false }
  let sessionExpired = false
  let sessionGate = null
  page.on('pageerror', error => errors.push(error.message))
  await page.setRequestInterception(true)
  page.on('request', async request => {
    const url = new URL(request.url())
    if (url.hostname === 'accounts.google.com') {
      return request.respond({ contentType: 'application/javascript', body: `
        window.google = { accounts: { id: {
          initialize(options) { this.callback = options.callback },
          renderButton(container) {
            const button = document.createElement('button')
            button.textContent = 'Lanjutkan dengan Google (fixture)'
            button.id = 'fixture-google'
            button.onclick = () => this.callback({ credential: 'fixture-google-token' })
            container.appendChild(button)
          }
        } } }
      ` })
    }
    if (!url.pathname.startsWith('/api/')) return request.continue()
    requests.push(url.pathname)
    const respond = (body, status = 200) => request.respond({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (url.pathname === '/api/auth/me') {
      if (sessionGate) await sessionGate
      return sessionExpired
        ? respond({ error: { code: 'UNAUTHORIZED', message: 'Fixture session expired' } }, 401)
        : respond(user)
    }
    if (url.pathname === '/api/auth/google') {
      assert.deepEqual(JSON.parse(request.postData()), { idToken: 'fixture-google-token' })
      return respond({ accessToken: 'fixture-access', refreshToken: 'fixture-refresh', user })
    }
    if (url.pathname === '/api/auth/logout') return respond(null)
    if (url.pathname === '/api/auth/refresh') return respond({ error: { code: 'UNAUTHORIZED', message: 'Fixture expired' } }, 401)
    if (url.pathname === '/api/mutawif/me') return respond({ verificationStatus: 'APPROVED', availabilityStatus: 'OFFLINE' })
    if (url.pathname === '/api/users/me/trips') return respond([])
    return respond({ items: [], meta: { total: 0 } })
  })
  const open = path => page.goto(`${origin}${path}`, { waitUntil: 'networkidle0' })
  const clearSession = () => page.evaluate(() => localStorage.clear())
  const contains = text => page.waitForFunction(value => document.body.textContent.includes(value), {}, text)
  const clickText = text => page.$$eval('button', (buttons, value) => {
    const button = buttons.find(item => item.textContent.includes(value))
    if (!button) throw new Error(`Button not found: ${value}`)
    button.click()
  }, text)

  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
  await open('/')
  await page.waitForSelector('.landing-page')
  assert.deepEqual(requests, [], 'The public landing page needs no API calls')
  assert.equal(await page.$eval('html', html => html.lang), 'id')
  assert.match(await page.title(), /Manaseek/)
  assert.equal(await page.$$eval('h1', headings => headings.length), 1)
  assert.equal(await page.$eval('.landing-page', element => element.clientWidth), 1440)
  assert.equal(await page.$('script[src*="accounts.google.com"]'), null, 'Google loads only on the login screen')

  // Keyboard navigation, native FAQ behavior, and in-page navigation.
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement.className), 'landing-skip')
  await page.keyboard.press('Enter')
  await page.focus('.landing-faq-list details:nth-child(2) summary')
  await page.keyboard.press('Enter')
  assert.equal(await page.$eval('.landing-faq-list details:nth-child(2)', element => element.open), true)
  assert.equal(await page.$$eval('.landing-faq-list details[open]', items => items.length), 1)
  await page.click('.landing-nav-links a[href="#fitur"]')
  assert.equal(new URL(page.url()).hash, '#fitur')

  for (const width of [320, 360, 390, 620, 768, 1024, 1440]) {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow at ${width}px`)
    assert.equal(await page.$eval('.landing-page', element => element.clientWidth), width)
    assert.equal(await page.$eval('.landing-nav-actions > a', element => {
      const rect = element.getBoundingClientRect()
      return rect.left >= 0 && rect.right <= innerWidth
    }), true, `Login is visible at ${width}px`)
  }

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  await page.click('.landing-menu-toggle')
  assert.equal(await page.$eval('.landing-menu-toggle', element => element.getAttribute('aria-expanded')), 'true')
  await page.click('.landing-nav-links a[href="#perjalanan"]')
  assert.equal(await page.$eval('.landing-menu-toggle', element => element.getAttribute('aria-expanded')), 'false')
  assert.equal(new URL(page.url()).hash, '#perjalanan')
  await page.click('.landing-menu-toggle')
  await page.keyboard.press('Escape')
  assert.equal(await page.$eval('.landing-menu-toggle', element => element.getAttribute('aria-expanded')), 'false')

  // Save both layouts for visual review, including below-the-fold imagery.
  const outDir = resolve(import.meta.dirname, '../../out')
  await mkdir(outDir, { recursive: true })
  await open('/')
  await page.$eval('.landing-faq-list details:first-child', element => { element.open = true })
  await page.screenshot({ path: resolve(outDir, 'landing-mobile.png'), fullPage: true })
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
  await page.screenshot({ path: resolve(outDir, 'landing-desktop.png'), fullPage: true })
  assert.equal(await page.$$eval('.landing-page img', images => images.every(image => image.complete && image.naturalWidth > 0)), true)

  // The main CTA opens Google login and an existing jamaah reaches home.
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('.landing-hero-actions a[href="?screen=login"]')])
  await page.waitForSelector('#fixture-google')
  assert.equal(new URL(page.url()).searchParams.get('screen'), 'login')
  await page.click('#fixture-google')
  await page.waitForSelector('.jamaah-home')
  assert.ok(requests.includes('/api/auth/google'))
  await open('/')
  await page.waitForFunction(() => document.querySelector('.landing-nav-actions > a')?.textContent.includes('Buka aplikasi'))
  assert.ok(await page.$('.landing-page'), 'The root stays a landing page even with an active session')
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('.landing-nav-actions > a')])
  await page.waitForSelector('.jamaah-home')
  assert.ok(await page.$eval('.jamaah-home', element => element.clientWidth <= 420), 'The application retains its mobile frame')
  await open('/?screen=profile')
  await contains('Keluar dari Akun')
  await clickText('Keluar dari Akun')
  await page.waitForSelector('.landing-page')
  assert.equal(new URL(page.url()).search, '')
  assert.equal(await page.evaluate(() => localStorage.getItem('manaseek.accessToken')), null)

  // New accounts retain onboarding, and mutawif accounts retain their dashboard.
  user = { ...user, needsOnboarding: true, isNewUser: true }
  await open('/?screen=login')
  await page.waitForSelector('#fixture-google')
  await page.click('#fixture-google')
  await contains('Pilih peranmu')
  await clearSession()
  user = { ...user, name: 'Mutawif Uji', role: 'MUTAWIF', needsOnboarding: false, isNewUser: false }
  await open('/?screen=login')
  await page.waitForSelector('#fixture-google')
  await page.click('#fixture-google')
  await contains('Ruang mutawif')
  await open('/?screen=login')
  await contains('Ruang mutawif')
  await clickText('Keluar')
  await page.waitForSelector('.landing-page')
  assert.equal(new URL(page.url()).search, '')

  for (const path of ['/?screen=currency', '/?screen=splash']) {
    await open(path)
    await page.waitForSelector('#fixture-google')
    assert.equal(await page.$('#currency-amount'), null, 'Signed-out visitors cannot open protected screens')
    await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('a[href="/"]')])
    await page.waitForSelector('.landing-page')
  }

  // A slow or expired saved session must never obscure the public page.
  let releaseSession
  sessionGate = new Promise(resolve => { releaseSession = resolve })
  sessionExpired = true
  await page.evaluate(() => localStorage.setItem('manaseek.accessToken', 'expired-fixture'))
  await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.landing-page')
  releaseSession()
  sessionGate = null
  await page.waitForFunction(() => localStorage.getItem('manaseek.accessToken') === null)
  assert.ok(await page.$('.landing-page'))
  assert.deepEqual(errors, [])
  console.log('Landing checks passed: public entry, responsive layouts, assets, keyboard, menu, FAQ, Google login fixture, onboarding, role routing, saved/expired sessions, protected screens, and logout.')
} finally {
  await browser?.close()
  await server.close()
}
