import { useCallback, useState } from 'react'
import GlassIcon from '../components/GlassIcon'
import mark from '../assets/home/manaseek-mark.png'
import kaaba from '../assets/home/kaaba-cutout.png'
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
    <div className="app-page flex flex-col min-h-full bg-white">
      <div className="welcome-hero canopy">
        <img src={mark} alt="Manaseek" className="page-brand" width="38" height="38" />
        <h1>Langkah tenang,<br />ibadah khusyuk.</h1>
        <p>Manaseek menemani perjalanan haji dan umrahmu, dari persiapan hingga ibadah.</p>
        <img src={kaaba} alt="" width="640" height="640" className="welcome-illustration" />
      </div>

      <div className="px-6 pt-7 pb-8 bg-white">
        <div className="welcome-features">
          {[
            { label: 'Panduan ibadah', icon: 'hajj', tone: 'gold' },
            { label: 'Tanya AI', icon: 'chat', tone: 'teal' },
            { label: 'Cari mutawif', icon: 'mutawif', tone: 'sage' },
          ].map(({ label, icon, tone }) => (
            <span key={label}><GlassIcon name={icon} tone={tone} /><span>{label}</span></span>
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
