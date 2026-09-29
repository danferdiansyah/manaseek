import { useState } from 'react'
import { ArrowDownUp, ExternalLink } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import BottomNav from '../components/BottomNav'
import CurrencyArtwork from '../components/CurrencyArtwork'
import { convertAmount, formatAmount, parseAmount, RATE_DATE, RATE_TIME, SAR_IDR_RATE, validConversion } from '../lib/currency'

const CURRENCIES = {
  SAR: { name: 'Riyal Saudi', symbol: '﷼', presets: [10, 50, 100, 500] },
  IDR: { name: 'Rupiah Indonesia', symbol: 'Rp', presets: [50000, 100000, 500000, 1000000] },
}

export default function CurrencyScreen({ navigate }) {
  const [from, setFrom] = useState('SAR')
  const [input, setInput] = useState('100')
  const to = from === 'SAR' ? 'IDR' : 'SAR'
  const amount = parseAmount(input)
  const converted = amount === null ? null : convertAmount(amount, from)
  const valid = amount !== null && validConversion(amount, converted)
  const invalid = amount !== null && !valid

  const swap = () => {
    if (valid) setInput(formatAmount(converted))
    setFrom(to)
  }

  return (
    <div className="app-page currency-page bg-stone">
      <PageHeader
        title="Riyal ↔ Rupiah"
        eyebrow="Bekal perjalanan"
        description="Hitung perkiraan belanja selama di Tanah Suci."
        onBack={() => navigate('home')}
      >
        <div className="currency-rate">
          <CurrencyArtwork />
          <div>
            <p>Kurs acuan</p>
            <strong>1 SAR = Rp{formatAmount(SAR_IDR_RATE.idrPerSar)}</strong>
            <small>{RATE_DATE}</small>
          </div>
        </div>
      </PageHeader>

      <main className="currency-content">
        <section className="currency-converter" aria-label="Konverter mata uang">
          <div className="currency-field-heading">
            <label htmlFor="currency-amount">Nominal yang dihitung</label>
            <span className="currency-code">{from}</span>
          </div>
          <p className="currency-name">{CURRENCIES[from].name}</p>
          <div className={`currency-input${invalid ? ' is-invalid' : ''}`}>
            <span aria-hidden="true">{CURRENCIES[from].symbol}</span>
            <input
              id="currency-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              maxLength={24}
              value={input}
              placeholder="0"
              onChange={(event) => setInput(event.target.value)}
              aria-invalid={invalid}
              aria-describedby={invalid ? 'currency-error' : 'currency-hint'}
            />
          </div>
          {invalid
            ? <p id="currency-error" className="currency-error" role="alert">{Number.isFinite(amount)
              ? 'Nominal terlalu besar. Gunakan nominal yang lebih kecil.'
              : 'Masukkan angka 0 atau lebih, maksimal 2 angka desimal.'}</p>
            : <p id="currency-hint" className="currency-hint">Gunakan koma untuk desimal, misalnya 10,50.</p>}

          <div className="currency-presets" aria-label="Nominal cepat">
            {CURRENCIES[from].presets.map((value) => (
              <button type="button" key={value} aria-pressed={amount === value} onClick={() => setInput(formatAmount(value, 0))}>
                {formatAmount(value, 0)}
              </button>
            ))}
          </div>

          <div className="currency-swap-row">
            <button type="button" onClick={swap} className="currency-swap" aria-label="Tukar arah konversi">
              <ArrowDownUp size={17} aria-hidden="true" /> Tukar arah
            </button>
          </div>

          <div className="currency-result" aria-live="polite" aria-atomic="true">
            <div className="currency-field-heading">
              <span>Perkiraan hasil</span>
              <span className="currency-code">{to}</span>
            </div>
            <output htmlFor="currency-amount">{valid ? `${CURRENCIES[to].symbol} ${formatAmount(converted)}` : '—'}</output>
            <p className="currency-name">{CURRENCIES[to].name}</p>
          </div>
        </section>

        <div className="currency-source">
          <p>Kurs tetap per {RATE_DATE}, {RATE_TIME} WIB. Kurs penukaran dan biaya layanan dapat berbeda.</p>
          <a href={SAR_IDR_RATE.sourceUrl} target="_blank" rel="noopener noreferrer">
            Sumber kurs: {SAR_IDR_RATE.sourceName} <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      </main>
      <BottomNav active="home" navigate={navigate} />
    </div>
  )
}
