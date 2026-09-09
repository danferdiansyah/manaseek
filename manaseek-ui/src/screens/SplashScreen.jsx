import { useCallback, useState } from 'react'
import { BookOpen, MessageCircle, UserCheck } from 'lucide-react'
import GoogleSignInButton from '../lib/GoogleSignInButton'
import { useAuth } from '../lib/auth-context'

export default function SplashScreen({ navigate }) {
  const { signInWithGoogle } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const goToNextScreen = useCallback((me) => {
    if (me?.needsOnboarding || me?.isNewUser) {
      navigate('onboarding')
      return
    }

    navigate(me?.role === 'MUTAWIF' ? 'mutawif-dashboard' : 'home')
  }, [navigate])

  const handleCredential = useCallback(
    async (idToken) => {
      setBusy(true)
      setError(null)
      try {
        const me = await signInWithGoogle(idToken)
        goToNextScreen(me)
      } catch (err) {
        setError(err.message ?? 'Gagal masuk. Coba lagi.')
      } finally {
        setBusy(false)
      }
    },
    [signInWithGoogle, goToNextScreen],
  )

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Green hero */}
      <div
        className="canopy flex flex-col items-center justify-center flex-1 px-8 pt-20 pb-10"
      >
        <div className="bg-white rounded-3xl p-5 mb-6 shadow-2xl">
          <img src="/logo.png" alt="Manaseek" className="w-28 h-28 object-contain" />
        </div>
        <h1 className="text-white text-3xl font-bold tracking-tight mb-2">Manaseek</h1>
        <p className="text-canopy-100/85 text-sm text-center leading-relaxed px-4">
          Pendamping ibadah haji &amp; umrah<br />berbasis AI untuk jamaah Indonesia
        </p>

        <div className="flex gap-2 mt-8">
          {[true, false, false].map((active, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full"
              style={{ width: active ? 24 : 8, background: active ? 'white' : 'rgba(255,255,255,0.35)' }}
            />
          ))}
        </div>
      </div>

      {/* Feature pills + sign in */}
      <div className="px-6 pt-6 pb-8 bg-white">
        <div className="flex gap-2 justify-center mb-6">
          {[
            { label: 'Guidance', Icon: BookOpen },
            { label: 'Chatbot AI', Icon: MessageCircle },
            { label: 'Mutawif', Icon: UserCheck },
          ].map(({ label, Icon }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: '#E8F3EC', color: '#1B5E35', border: '1px solid #C3DFC9' }}
            >
              <Icon size={11} />
              {label}
            </span>
          ))}
        </div>

        {busy ? (
          <p className="text-center text-sm text-ink-soft py-3">Menyiapkan akun…</p>
        ) : (
          <GoogleSignInButton onCredential={handleCredential} onError={setError} />
        )}

        {error && <p className="text-center text-xs text-red-500 mt-3">{error}</p>}

        <p className="text-center text-xs text-ink-faint mt-5">
          Masuk dengan akun Google. Dengan melanjutkan, kamu menyetujui{' '}
          <span style={{ color: '#B8944A' }}>Syarat &amp; Ketentuan</span> kami
        </p>
      </div>
    </div>
  )
}
