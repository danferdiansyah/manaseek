import { BookOpen, MessageCircle, UserCheck } from 'lucide-react'

export default function SplashScreen({ navigate }) {
  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Green hero */}
      <div
        className="flex flex-col items-center justify-center flex-1 px-8 pt-20 pb-10"
        style={{ background: 'linear-gradient(150deg, #0f3d22 0%, #1B5E35 45%, #2D7A4F 100%)' }}
      >
        <div className="bg-white rounded-3xl p-5 mb-6 shadow-2xl">
          <img src="/logo.png" alt="Manaseek" className="w-28 h-28 object-contain" />
        </div>
        <h1 className="text-white text-3xl font-bold tracking-tight mb-2">Manaseek</h1>
        <p className="text-green-100 text-sm text-center leading-relaxed px-4">
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

      {/* Feature pills */}
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

        <button
          onClick={() => navigate('home')}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base mb-3 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1B5E35 0%, #2D7A4F 100%)' }}
        >
          Masuk ke Akun
        </button>
        <button
          onClick={() => navigate('home')}
          className="w-full py-4 rounded-2xl font-semibold text-base border-2"
          style={{ borderColor: '#1B5E35', color: '#1B5E35' }}
        >
          Daftar Sekarang
        </button>

        <p className="text-center text-xs text-gray-400 mt-5">
          Dengan mendaftar, kamu menyetujui{' '}
          <span style={{ color: '#B8944A' }}>Syarat &amp; Ketentuan</span> kami
        </p>
      </div>
    </div>
  )
}
