import { useState } from 'react'
import {
  BriefcaseBusiness,
  Check,
  ChevronRight,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import PageHeader from '../components/PageHeader'
import GlassIcon from '../components/GlassIcon'

const ROLES = [
  {
    id: 'JAMAAH',
    icon: 'profile',
    title: 'Jamaah',
    description: 'Cari panduan ibadah, gunakan chatbot AI, dan pesan mutawif.',
  },
  {
    id: 'MUTAWIF',
    icon: 'mutawif',
    title: 'Mutawif',
    description: 'Tawarkan pendampingan ibadah dan terima permintaan jamaah.',
  },
]

function Field({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      <input
        {...props}
        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-ink outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100"
      />
      {hint && <span className="block mt-1 text-[11px] text-ink-faint">{hint}</span>}
    </label>
  )
}

export default function OnboardingScreen({ navigate }) {
  const { user, completeOnboarding } = useAuth()
  const [step, setStep] = useState('role')
  const [role, setRole] = useState(null)
  const [form, setForm] = useState(() => ({
    name: user?.name ?? '',
    phone: '',
    city: '',
    bio: '',
    yearsExperience: '',
    languages: 'Indonesia, Arab',
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const updateField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setError(null)
  }

  const continueToProfile = () => {
    if (!role) return
    setError(null)
    setStep('profile')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!role) return

    setBusy(true)
    setError(null)

    const languages = form.languages
      .split(',')
      .map((language) => language.trim())
      .filter(Boolean)

    try {
      const me = await completeOnboarding({
        role,
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        city: form.city.trim(),
        ...(role === 'MUTAWIF'
          ? {
              bio: form.bio.trim() || undefined,
              languages: languages.length > 0 ? languages : undefined,
              yearsExperience: form.yearsExperience === '' ? undefined : Number(form.yearsExperience),
            }
          : {}),
      })

      navigate(me.role === 'MUTAWIF' ? 'mutawif-dashboard' : 'home')
    } catch (err) {
      setError(err.message ?? 'Data belum bisa disimpan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'role') {
    return (
      <div className="app-page flex flex-col min-h-full bg-stone">
        <PageHeader title="Mulai perjalananmu" eyebrow="Selamat datang · 1 dari 2" description="Kamu ingin menggunakan Manaseek sebagai siapa? Pilih peran yang sesuai untukmu." icon="travel" />

        <div className="px-5 pt-6 pb-10 flex-1">
          <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">Pilih peranmu</p>
          <div className="space-y-3">
            {ROLES.map(({ id, icon, title, description }) => {
              const selected = role === id
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setRole(id)
                    setError(null)
                  }}
                  className="w-full rounded-[20px] p-4 text-left flex items-start gap-3 transition"
                  style={{
                    background: selected ? '#E8F3EC' : 'rgba(255,255,255,.85)',
                    border: `2px solid ${selected ? '#1B5E35' : 'rgba(255,255,255,.95)'}`,
                    boxShadow: selected ? '0 8px 20px rgba(27,94,53,.10)' : '0 8px 20px rgba(35,53,42,.05)',
                  }}
                >
                  <GlassIcon name={icon} tone={id === 'MUTAWIF' ? 'gold' : 'green'} />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold text-ink">{title}</span>
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: selected ? '#1B5E35' : 'white',
                          border: `1.5px solid ${selected ? '#1B5E35' : '#D1D5DB'}`,
                        }}
                      >
                        {selected && <Check size={13} color="white" strokeWidth={3} />}
                      </span>
                    </span>
                    <span className="block text-sm text-ink-soft leading-relaxed mt-1">{description}</span>
                  </span>
                </button>
              )
            })}
          </div>

          {role === 'MUTAWIF' && (
            <div className="mt-4 rounded-2xl p-3.5 flex items-start gap-2.5" style={{ background: '#FFF8E7', border: '1px solid #F1DFB1' }}>
              <ShieldCheck size={17} color="#A77915" className="mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed" style={{ color: '#80631F' }}>
                Setelah data tersimpan, aktifkan status Online untuk mulai menerima order jamaah.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={continueToProfile}
            disabled={!role}
            className="w-full mt-8 py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}
          >
            Lanjutkan <ChevronRight size={17} />
          </button>
          <p className="text-center text-xs text-ink-faint mt-4">Kamu hanya perlu mengisi data ini satu kali.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-page flex flex-col min-h-full bg-stone">
      <PageHeader title="Mari berkenalan" eyebrow="Data awal · 2 dari 2" description="Lengkapi profil singkatmu agar jamaah dan mutawif dapat saling mengenal." icon={role === 'MUTAWIF' ? 'mutawif' : 'profile'} onBack={() => setStep('role')} />

      <form onSubmit={submit} className="px-5 pt-6 pb-10 flex-1">
        <div className="glass rounded-[20px] p-4 space-y-4">
          <Field label="Nama lengkap" value={form.name} onChange={updateField('name')} required autoComplete="name" />
          <Field
            label="Nomor WhatsApp"
            hint="Opsional, agar mudah dihubungi terkait pesanan."
            value={form.phone}
            onChange={updateField('phone')}
            type="tel"
            autoComplete="tel"
            placeholder="08xxxxxxxxxx"
          />
          <Field
            label="Kota domisili"
            value={form.city}
            onChange={updateField('city')}
            required
            autoComplete="address-level2"
            placeholder="Contoh: Surabaya"
          />
        </div>

        {role === 'MUTAWIF' && (
          <div className="glass rounded-[20px] p-4 mt-4 space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5" style={{ background: '#FFF8E7' }}>
              <BriefcaseBusiness size={16} color="#A77915" className="mt-0.5 flex-shrink-0" />
              <p className="text-xs leading-relaxed" style={{ color: '#80631F' }}>
                Lengkapi data singkat ini agar jamaah bisa mengenalmu saat mengirim permintaan.
              </p>
            </div>
            <Field
              label="Pengalaman mendampingi (tahun)"
              value={form.yearsExperience}
              onChange={updateField('yearsExperience')}
              type="number"
              min="0"
              max="60"
              placeholder="0"
            />
            <Field
              label="Bahasa yang dikuasai"
              hint="Pisahkan dengan koma."
              value={form.languages}
              onChange={updateField('languages')}
              placeholder="Indonesia, Arab"
            />
            <label className="block">
              <span className="text-xs font-semibold text-ink-soft">Cerita singkat tentang kamu</span>
              <textarea
                value={form.bio}
                onChange={updateField('bio')}
                rows={3}
                placeholder="Contoh: Senang membantu jamaah menjalankan ibadah dengan nyaman."
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-ink outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100 resize-none"
              />
            </label>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl px-3 py-2.5 text-xs leading-relaxed text-red-700" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !form.name.trim() || !form.city.trim()}
          className="w-full mt-6 py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}
        >
          {busy ? 'Menyimpan data…' : role === 'MUTAWIF' ? 'Daftarkan profil mutawif' : 'Mulai menggunakan Manaseek'}
        </button>

        <p className="text-center text-xs text-ink-faint leading-relaxed mt-4">
          <Phone size={12} className="inline mr-1" /> Nomor WhatsApp bersifat opsional dan bisa dilengkapi nanti.
        </p>
        <p className="text-center text-xs text-ink-faint leading-relaxed mt-2">
          <MapPin size={12} className="inline mr-1" /> Data profil dapat kamu perbarui setelah masuk.
        </p>
      </form>
    </div>
  )
}
