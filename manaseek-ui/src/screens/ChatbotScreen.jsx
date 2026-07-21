import { ArrowLeft, MoreHorizontal, Send, Bot, AlertCircle } from 'lucide-react'
import { BottomNav } from './HomeScreen'

const messages = [
  { role: 'ai',   text: "Assalamu'alaikum! Saya asisten ibadah Manaseek. Ada yang bisa saya bantu seputar haji atau umrah?", time: '09:01' },
  { role: 'user', text: 'Saya sedang ihram dan tidak sengaja membunuh nyamuk, apakah ibadah saya batal?', time: '09:02' },
  { role: 'ai',   text: "Membunuh nyamuk saat ihram tidak membatalkan ihram dan tidak ada dam (denda) yang wajib dibayar. Larangan ihram hanya berlaku untuk membunuh hewan buruan darat yang liar. Nyamuk termasuk hewan yang boleh dibunuh karena mengganggu.\n\nSumber: Fiqih Mazhab Syafi'i, Al-Majmu' Syarh Al-Muhadzdzab.", time: '09:02' },
]

const suggestions = ['Cara niat ihram umrah', 'Doa masuk Masjidil Haram', 'Tata cara tawaf', 'Larangan ihram lengkap']

export default function ChatbotScreen({ navigate }) {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('home')} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#E8F3EC' }}>
            <ArrowLeft size={16} color="#1B5E35" />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
            <Bot size={18} color="white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Manaseek AI</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <p className="text-xs text-gray-400">Online • Siap membantu</p>
            </div>
          </div>
          <button className="ml-auto"><MoreHorizontal size={20} color="#9CA3AF" /></button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mx-4 mt-4 px-4 py-2.5 rounded-xl flex items-start gap-2" style={{ background: 'linear-gradient(135deg, #FFF8EC, #FFF4E5)' }}>
        <AlertCircle size={13} color="#B8944A" className="flex-shrink-0 mt-0.5" />
        <p className="text-xs" style={{ color: '#8B6914' }}>
          AI ini adalah asisten informasi, bukan pemberi fatwa. Konsultasikan hal kompleks ke pembimbing ibadah.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-4 mb-36">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {m.role === 'ai' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-auto" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
                <Bot size={14} color="white" />
              </div>
            )}
            <div className={`max-w-[80%] flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={m.role === 'user'
                  ? { background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)', color: 'white', borderBottomRightRadius: 4 }
                  : { background: 'white', color: '#374151', borderBottomLeftRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                {m.text.split('\n\n').map((p, j) => <p key={j} className={j > 0 ? 'mt-2' : ''}>{p}</p>)}
              </div>
              <span className="text-[10px] text-gray-400 px-1">{m.time}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
            <Bot size={14} color="white" />
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white shadow-sm flex gap-1.5 items-center">
            {[0, 1, 2].map((d) => (
              <div key={d} className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions + Input */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[390px] bg-white border-t border-gray-100 px-4 pt-3 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {suggestions.map((s) => (
            <span key={s} className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium cursor-pointer"
              style={{ borderColor: '#1B5E35', color: '#1B5E35' }}>
              {s}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input readOnly placeholder="Ketik pertanyaan..." className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none" />
          <button className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
            <Send size={16} color="white" />
          </button>
        </div>
      </div>

      <BottomNav active="chatbot" navigate={navigate} />
    </div>
  )
}
