import { ClipboardList, Bookmark, CheckSquare, Bell, Lock, HelpCircle, FileText, ChevronRight, LogOut, Zap, Landmark } from 'lucide-react'
import { BottomNav } from './HomeScreen'

const menu = [
  { Icon: ClipboardList, label: 'Riwayat Pemesanan',  sub: '3 pesanan selesai' },
  { Icon: Bookmark,      label: 'Panduan Tersimpan',  sub: '7 panduan disimpan' },
  { Icon: CheckSquare,   label: 'Checklist Persiapan', sub: '3 dari 12 selesai' },
  { Icon: Bell,          label: 'Notifikasi',          sub: 'Aktif' },
  { Icon: Lock,          label: 'Keamanan Akun',       sub: '' },
  { Icon: HelpCircle,    label: 'Bantuan & FAQ',       sub: '' },
  { Icon: FileText,      label: 'Syarat & Ketentuan',  sub: '' },
]

export default function ProfileScreen({ navigate }) {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-8" style={{ background: 'linear-gradient(150deg, #0f3d22 0%, #1B5E35 50%, #2D7A4F 100%)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Profil Saya</h2>
          <button className="text-green-200 text-sm font-medium">Edit</button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-xl border-2 border-white/25"
            style={{ background: 'linear-gradient(135deg, #B8944A, #D4A855)' }}>
            AF
          </div>
          <div>
            <p className="text-white font-bold text-base">Ahmad Fauzi</p>
            <p className="text-green-200 text-xs mt-0.5">ahmad.fauzi@email.com</p>
            <span className="mt-2 inline-block text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.9)' }}>
              Pengguna Gratis
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade banner */}
      <div className="mx-5 -mt-4 rounded-2xl p-4 shadow-sm flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #B8944A 0%, #D4A855 100%)' }}>
        <Zap size={22} color="white" strokeWidth={1.8} className="flex-shrink-0" />
        <div className="flex-1">
          <p className="text-white font-bold text-sm">Upgrade ke Manaseek+</p>
          <p className="text-white/80 text-xs mt-0.5">Chatbot AI tanpa batas &amp; fitur premium</p>
        </div>
        <button className="bg-white px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0" style={{ color: '#B8944A' }}>
          Coba Gratis
        </button>
      </div>

      {/* Rencana ibadah */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-800">Rencana Ibadah</p>
          <button className="text-xs font-medium" style={{ color: '#1B5E35' }}>+ Tambah</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E8F3EC, #C3DFC9)' }}>
            <Landmark size={20} color="#1B5E35" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Umrah Maret 2025</p>
            <div className="mt-1.5 bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full w-2/5" style={{ background: 'linear-gradient(90deg, #1B5E35, #2D7A4F)' }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Persiapan 40% selesai</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="mx-5 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {menu.map(({ Icon, label, sub }, i) => (
          <div key={label} className={`flex items-center gap-3 px-4 py-3.5 ${i < menu.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E8F3EC' }}>
              <Icon size={15} color="#1B5E35" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{label}</p>
              {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
            <ChevronRight size={15} color="#D1D5DB" />
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className="mx-5 mt-4 mb-24">
        <button onClick={() => navigate('splash')}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold border-2 flex items-center justify-center gap-2"
          style={{ borderColor: '#EF4444', color: '#EF4444' }}>
          <LogOut size={15} /> Keluar dari Akun
        </button>
      </div>

      <BottomNav active="profile" navigate={navigate} />
    </div>
  )
}
