import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import puppeteer from 'puppeteer'

// Browser regression checks use an in-memory API fixture, never real accounts
// or model calls. Vite chooses a free port and is closed when the check ends.
const server = await createServer({
  root: resolve(import.meta.dirname, '..'),
  server: { host: '127.0.0.1', port: 0 },
})
let browser
try {
  await server.listen()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  const browserErrors = []
  page.on('pageerror', error => browserErrors.push(error.message))
  await page.evaluateOnNewDocument(() => localStorage.setItem('manaseek.accessToken', 'fixture-token'))

  let activity = Date.now()
  const message = (role, content) => ({ id: randomUUID(), role, content, citedSlugs: [], escalated: false, createdAt: new Date().toISOString() })
  let sessions = Array.from({ length: 23 }, (_, i) => ({
    id: randomUUID(),
    title: i === 0 ? 'Persiapan ihram' : i === 1 ? 'Panduan thawaf' : `Percakapan ${i + 1}`,
    createdAt: new Date(activity - i * 86400000).toISOString(),
    updatedAt: new Date(activity - i * 86400000).toISOString(),
    messages: i === 0
      ? Array.from({ length: 55 }, (_, j) => message(j % 2 ? 'ASSISTANT' : 'USER', `Pesan tersimpan ${j + 1}`))
      : [message('USER', `Pertanyaan sesi ${i + 1}`), { ...message('ASSISTANT', `Jawaban sesi ${i + 1}`), citedSlugs: ['thawaf'], escalated: true }],
  }))
  const original = sessions[0]
  const older = sessions[1]
  const posts = []
  let failHistory = false
  let failSession = null
  let delaySession = null
  let delayLatest = false
  let releaseDelay
  let signalDelayed
  let delayGate
  const prepareDelay = () => {
    delayGate = new Promise(resolve => { releaseDelay = resolve })
    return new Promise(resolve => { signalDelayed = resolve })
  }
  const paginate = (items, page, limit) => ({
    items: items.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / limit)) },
  })
  await page.setRequestInterception(true)
  page.on('request', async request => {
    const url = new URL(request.url())
    if (!url.pathname.startsWith('/api/')) return request.continue()
    const respond = (body, status = 200) => request.respond({ status, contentType: 'application/json', body: JSON.stringify(body) })
    const failure = () => respond({ error: { code: 'INTERNAL_ERROR', message: 'Gagal memuat fixture' } }, 503)
    if (url.pathname === '/api/auth/me') return respond({ id: 'fixture-user', role: 'JAMAAH', name: 'Jamaah', needsOnboarding: false })
    if (url.pathname === '/api/content/topics') return respond({ items: [{ slug: 'thawaf', title: 'Panduan thawaf' }] })
    if (url.pathname === '/api/chat/sessions') {
      if (failHistory) return failure()
      if (delayLatest && url.searchParams.get('limit') === '1') { signalDelayed(); await delayGate }
      const history = [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(({ messages, ...session }) => ({
        ...session, messageCount: messages.length, preview: messages.at(-1)?.content ?? '',
      }))
      return respond(paginate(history, Number(url.searchParams.get('page') || 1), Number(url.searchParams.get('limit') || 20)))
    }
    const match = url.pathname.match(/^\/api\/chat\/sessions\/([^/]+)\/messages$/)
    if (match) {
      if (failSession === match[1]) return failure()
      if (delaySession === match[1]) { signalDelayed(); await delayGate }
      const session = sessions.find(item => item.id === match[1])
      if (!session) return respond({ error: { code: 'NOT_FOUND', message: 'Percakapan tidak ditemukan' } }, 404)
      const result = paginate([...session.messages].reverse(), Number(url.searchParams.get('page') || 1), Number(url.searchParams.get('limit') || 50))
      return respond({ ...result, items: result.items.reverse(), session: { id: session.id, title: session.title } })
    }
    if (url.pathname === '/api/chat/messages') {
      const body = JSON.parse(request.postData())
      posts.push(body)
      if (body.text === 'Gagal sebelum tersimpan') return failure()
      let session = sessions.find(item => item.id === body.sessionId)
      if (!session) {
        session = { id: randomUUID(), title: body.text, createdAt: new Date().toISOString(), messages: [] }
        sessions.push(session)
      }
      session.updatedAt = new Date(activity += 1000).toISOString()
      const userMessage = message('USER', body.text)
      session.messages.push(userMessage)
      if (body.text === 'Kuota habis') return respond({ error: {
        code: 'AI_QUOTA_EXCEEDED', message: 'Kuota harian asisten AI sudah habis.',
        details: { sessionId: session.id, userMessage },
      } }, 429)
      const reply = message('ASSISTANT', `Jawaban untuk: ${body.text}`)
      session.messages.push(reply)
      return respond({ sessionId: session.id, userMessage, message: reply })
    }
    return respond({ items: [], meta: { total: 0 } })
  })

  const ready = () => page.waitForFunction(() => !document.querySelector('[aria-label="Pertanyaan"]')?.disabled)
  const contains = text => page.waitForFunction(value => document.body.innerText.includes(value), {}, text)
  const history = () => page.click('[aria-label="Buka riwayat percakapan"]')
  const newChat = () => page.click('.chat-toolbar button:first-child')
  const select = title => page.$$eval('.chat-history-item', (items, value) => items.find(item => item.querySelector('strong').textContent === value).click(), title)
  const send = async text => {
    await ready()
    await page.type('[aria-label="Pertanyaan"]', text)
    await page.click('[aria-label="Kirim"]')
    await ready()
  }
  const open = async () => {
    await page.goto(`${origin}/?screen=chatbot`, { waitUntil: 'networkidle2' })
    await ready()
  }

  await open()
  await contains('Pesan tersimpan 55')
  assert.equal(await page.$$eval('[data-message-id]', items => items.length), 50)
  await page.click('.chat-messages .chat-load-more')
  await page.waitForFunction(() => document.querySelectorAll('[data-message-id]').length === 55)
  console.log('PASS restores the latest session and loads older messages')

  await history()
  await page.waitForSelector('.chat-history-item')
  assert.equal(await page.$$eval('.chat-history-item', items => items.length), 20)
  await page.click('.chat-history .chat-load-more')
  await page.waitForFunction(() => document.querySelectorAll('.chat-history-item').length === 23)
  await select(older.title)
  await ready()
  await contains('Jawaban sesi 2')
  await contains('Tanya mutawif langsung')
  assert.equal(await page.$$eval('[data-message-id]', items => items.length), 2)
  await send('Bagaimana langkah berikutnya?')
  await contains('Jawaban untuk: Bagaimana langkah berikutnya?')
  assert.equal(posts.at(-1).sessionId, older.id)
  await open()
  await contains('Jawaban untuk: Bagaimana langkah berikutnya?')
  console.log('PASS paginated history, saved citations, continuation, and refresh')

  await newChat()
  assert.equal(await page.$$eval('[data-message-id]', items => items.length), 0)
  await send('Pertanyaan percakapan baru')
  assert.equal(posts.at(-1).sessionId, undefined)
  await page.waitForFunction(() => document.querySelectorAll('[data-message-id]').length === 2)
  await newChat()
  await send('Kuota habis')
  await contains('Kuota harian asisten AI sudah habis.')
  const saved = sessions.find(session => session.title === 'Kuota habis')
  assert.equal(await page.$$eval('[data-message-id]', items => items.length), 1)
  await send('Lanjutkan percakapan ini')
  assert.equal(posts.at(-1).sessionId, saved.id)
  await send('Gagal sebelum tersimpan')
  await page.waitForFunction(() => document.querySelector('[aria-label="Pertanyaan"]').value === 'Gagal sebelum tersimpan')
  assert.equal(await page.$$eval('[data-message-id]', items => items.length), 3)
  console.log('PASS new conversations and saved/unsaved send failures')

  await history()
  await page.waitForSelector('.chat-history-item')
  failSession = older.id
  await select(older.title)
  await contains('Gagal memuat fixture')
  assert.equal(await page.$eval('[aria-label="Pertanyaan"]', el => el.disabled), true)
  assert.equal(await page.$$eval('[data-message-id]', items => items.length), 0)
  failSession = null
  await page.click('.chat-messages [role="alert"] button')
  await ready()

  await history()
  await page.waitForSelector('.chat-history-item')
  delaySession = original.id
  const delayedSessionStarted = prepareDelay()
  await select(original.title)
  await delayedSessionStarted
  await history()
  await page.waitForSelector('.chat-history-item')
  await select(older.title)
  await ready()
  delaySession = null
  const lateResponse = page.waitForResponse(response => response.url().includes(original.id))
  releaseDelay()
  await lateResponse
  await page.waitForNetworkIdle({ idleTime: 100 })
  assert.equal(await page.$eval('.chat-conversation-title', el => el.textContent), older.title)
  console.log('PASS failed session retries and ignores late responses from another session')

  failHistory = true
  await history()
  await contains('Gagal memuat fixture')
  failHistory = false
  await page.click('.chat-history [role="alert"] button')
  await page.waitForSelector('.chat-history-item')
  await page.setViewport({ width: 320, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320)

  delayLatest = true
  const delayedRestoreStarted = prepareDelay()
  await page.goto(`${origin}/?screen=chatbot`, { waitUntil: 'domcontentloaded' })
  await delayedRestoreStarted
  await newChat()
  delayLatest = false
  releaseDelay()
  await page.waitForNetworkIdle({ idleTime: 100 })
  assert.equal(await page.$$eval('[data-message-id]', items => items.length), 0)
  await ready()

  sessions = []
  await open()
  await contains('Belajar, lebih dekat.')
  await history()
  await contains('Belum ada percakapan')
  assert.deepEqual(browserErrors, [])
  console.log('PASS history retries, narrow layout, restore cancellation, empty history, and no browser errors')
} finally {
  await browser?.close()
  await server.close()
}
