// Frozen XE mid-market quote, rounded to two IDR decimals. Update the amount,
// timestamp and source together; never label this snapshot with today's date.
export const SAR_IDR_RATE = Object.freeze({
  idrPerSar: 4803.30,
  asOf: '2026-09-29T00:55:00Z',
  sourceName: 'XE',
  sourceUrl: 'https://www.xe.com/en-us/currencyconverter/convert/?Amount=1&From=SAR&To=IDR',
})

export const RATE_DATE = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
}).format(new Date(SAR_IDR_RATE.asOf))

export const RATE_TIME = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
}).format(new Date(SAR_IDR_RATE.asOf))

export function formatAmount(amount, minimumFractionDigits = 2) {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits, maximumFractionDigits: 2 }).format(amount)
}

export function convertAmount(amount, from) {
  return from === 'SAR' ? amount * SAR_IDR_RATE.idrPerSar : amount / SAR_IDR_RATE.idrPerSar
}

export function parseAmount(value) {
  const text = value.trim()
  if (!text) return null
  // Indonesian thousands and decimals, plus a decimal point from mobile
  // keyboards. A dot followed by three digits is a thousands separator.
  const grouped = /^\d{1,3}(?:\.\d{3})+(?:,\d{0,2})?$/.test(text)
  if (!grouped && !/^(?:\d+(?:[.,]\d{0,2})?|[.,]\d{1,2})$/.test(text)) return NaN
  const amount = Number((grouped ? text.replaceAll('.', '') : text).replace(',', '.'))
  return Number.isFinite(amount) ? amount : NaN
}

export function validConversion(amount, converted) {
  return Number.isFinite(amount) && amount >= 0 && Number.isSafeInteger(Math.round(Math.max(amount, converted) * 100))
}
