import { useEffect, useRef, useState } from 'react'

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

/** Loads the Google Identity Services script once, shared by every caller. */
let scriptPromise = null

function loadGoogleScript() {
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat Google Sign-In'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

/**
 * Renders Google's own sign-in button. Google hands us an ID token in the
 * browser; the backend is the only thing that verifies it.
 */
export default function GoogleSignInButton({ onCredential, onError }) {
  const containerRef = useRef(null)
  const [state, setState] = useState(CLIENT_ID ? 'loading' : 'unconfigured')

  useEffect(() => {
    if (!CLIENT_ID) return

    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current) return

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => onCredential(response.credential),
          // The prototype is a mobile-width web app; the popup flow behaves
          // better there than the one-tap overlay.
          ux_mode: 'popup',
        })

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          locale: 'id',
          width: 320,
        })

        setState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setState('unavailable')
        onError?.(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [onCredential, onError])

  if (state === 'unconfigured') {
    return (
      <p className="text-center text-xs text-red-500 py-3 leading-relaxed">
        VITE_GOOGLE_CLIENT_ID belum diisi, jadi tombol Google tidak bisa dirender.
      </p>
    )
  }

  if (state === 'unavailable') {
    return (
      <p className="text-center text-xs text-red-500 py-3 leading-relaxed">
        Google Sign-In gagal dimuat. Periksa koneksi dan daftar Authorised
        JavaScript origins di Google Cloud.
      </p>
    )
  }

  return (
    <div className="flex justify-center min-h-[44px]">
      <div ref={containerRef} />
    </div>
  )
}
