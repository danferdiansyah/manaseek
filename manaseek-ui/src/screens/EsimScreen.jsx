import {
  ArrowLeft, Signal, ShieldCheck, Zap, QrCode, Phone,
  Globe, Check, CreditCard, Sparkles, ChevronRight
} from 'lucide-react'

// NB: nama provider di bawah masih placeholder / dummy — ganti saat mitra final
const PROVIDERS = [
  { id: 'salamroam',  name: 'SalamRoam',    tag: 'Mitra Utama', active: true },
  { id: 'haramnet',   name: 'HaramNet',     tag: 'Alternatif',  active: false },
  { id: 'nusatel',    name: 'NusaTel KSA',  tag: 'Alternatif',  active: false },
]

const PACKAGES = [
  { id: 'hemat', quota: '5 GB',  days: '7 hari',  price: 'Rp 89.000',  note: 'Cocok untuk umrah singkat', selected: false, popular: false },
  { id: 'plus',  quota: '15 GB', days: '15 hari', price: 'Rp 179.000', note: 'Paling banyak dipilih jamaah', selected: true,  popular: true  },
  { id: 'puas',  quota: '30 GB', days: '30 hari', price: 'Rp 299.000', note: 'Untuk umrah + wisata religi',  selected: false, popular: false },
]

const BENEFITS = [
  { Icon: QrCode,     title: 'Aktivasi instan',      desc: 'Scan QR, langsung aktif tanpa ganti kartu' },
  { Icon: Signal,     title: 'Sinyal 4G/5G',         desc: 'Kuat di Makkah, Madinah & Jeddah' },
  { Icon: Phone,      title: 'Nomor lokal +966',     desc: 'Bisa telepon & SMS antar jamaah' },
  { Icon: ShieldCheck,title: 'Tanpa biaya roaming',  desc: 'Harga tetap, tidak ada tagihan kejutan' },
]

export default function EsimScreen({ navigate }) {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-8" style={{ background: 'linear-gradient(150deg, #0f3d22 0%, #1B5E35 50%, #2D7A4F 100%)' }}>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate('home')} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <ArrowLeft size={16} color="white" />
          </button>
          <div>
            <h2 className="text-white font-bold text-base">eSIM Saudi Arabia</h2>
            <p className="text-green-200 text-xs">Tetap terhubung selama ibadah</p>
          </div>
          <div className="ml-auto w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <Globe size={18} color="white" strokeWidth={1.8} />
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 z-10 relative space-y-4 mb-4">
        {/* Provider hero card */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
              <Signal size={22} color="white" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-gray-800 text-sm">SalamRoam</p>
                <ShieldCheck size={13} color="#1B5E35" />
              </div>
              <p className="text-xs text-gray-400">Provider eSIM mitra Saudi • aktif di 3 kota suci</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {['4G/5G', 'Coverage KSA', 'Aktif 24 jam'].map((c) => (
              <span key={c} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: '#E8F3EC', color: '#1B5E35' }}>{c}</span>
            ))}
          </div>
        </div>

        {/* Provider selector */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pilih Provider</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl border text-left"
                style={p.active
                  ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', borderColor: '#1B5E35' }
                  : { background: 'white', borderColor: '#E5E7EB' }}
              >
                <p className="text-sm font-bold" style={{ color: p.active ? 'white' : '#374151' }}>{p.name}</p>
                <p className="text-[10px]" style={{ color: p.active ? 'rgba(255,255,255,0.75)' : '#9CA3AF' }}>{p.tag}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Data packages */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pilih Paket Data</p>
          <div className="space-y-3">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="relative bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3"
                style={{ borderColor: pkg.selected ? '#1B5E35' : '#E5E7EB', borderWidth: pkg.selected ? 2 : 1 }}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-1" style={{ background: 'linear-gradient(135deg, #B8944A, #D4A855)' }}>
                    <Sparkles size={9} /> Terpopuler
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: pkg.selected ? '#E8F3EC' : '#F3F4F6' }}>
                  <span className="text-sm font-extrabold leading-none" style={{ color: pkg.selected ? '#1B5E35' : '#6B7280' }}>{pkg.quota.split(' ')[0]}</span>
                  <span className="text-[9px]" style={{ color: pkg.selected ? '#1B5E35' : '#9CA3AF' }}>GB</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{pkg.quota} • {pkg.days}</p>
                  <p className="text-xs text-gray-400 truncate">{pkg.note}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: '#1B5E35' }}>{pkg.price}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: pkg.selected ? '#1B5E35' : '#D1D5DB' }}>
                  {pkg.selected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#1B5E35' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Keuntungan</p>
          <div className="grid grid-cols-2 gap-3">
            {BENEFITS.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: '#E8F3EC' }}>
                  <Icon size={16} color="#1B5E35" strokeWidth={1.8} />
                </div>
                <p className="text-xs font-bold text-gray-800">{title}</p>
                <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cara Aktivasi</p>
          <div className="space-y-3">
            {[
              { Icon: CreditCard, t: 'Beli paket', d: 'Bayar via aplikasi, QR eSIM langsung terbit' },
              { Icon: QrCode,     t: 'Scan QR code', d: 'Buka pengaturan seluler, tambah eSIM' },
              { Icon: Zap,        t: 'Aktif otomatis', d: 'Terhubung begitu mendarat di Saudi' },
            ].map(({ Icon, t, d }, i) => (
              <div key={t} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>{i + 1}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{t}</p>
                  <p className="text-xs text-gray-400">{d}</p>
                </div>
                <Icon size={16} color="#9CA3AF" strokeWidth={1.8} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 mt-auto w-full bg-white border-t border-gray-100 px-5 py-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400">Paket terpilih • SalamRoam</p>
            <p className="text-sm font-bold text-gray-800">15 GB — 15 hari</p>
          </div>
          <p className="text-lg font-extrabold" style={{ color: '#1B5E35' }}>Rp 179.000</p>
        </div>
        <button onClick={() => navigate('booking-success')} className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
          <Signal size={18} /> Beli &amp; Aktifkan eSIM
        </button>
        <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
          <ShieldCheck size={11} color="#9CA3AF" /> QR eSIM terbit otomatis setelah pembayaran
        </p>
      </div>
    </div>
  )
}
