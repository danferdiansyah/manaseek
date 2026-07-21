import { ArrowLeft, Bookmark, Play, AlertTriangle, ChevronRight, Volume2, Layers } from 'lucide-react'

const steps = [
  'Pastikan berada di miqat dan dalam keadaan suci (berwudhu)',
  'Mengenakan pakaian ihram (dua lembar kain putih untuk laki-laki)',
  'Mengucapkan niat ihram untuk umrah',
  'Mengucapkan talbiyah secara berulang sepanjang perjalanan',
]

const doaItems = [
  { arab: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ', latin: "Labbaikallahumma labbaik", arti: 'Aku penuhi panggilan-Mu ya Allah' },
  { arab: 'لَبَّيْكَ لَا شَرِيْكَ لَكَ لَبَّيْكَ', latin: 'Labbaika laa syarika laka labbaik', arti: 'Aku penuhi panggilan-Mu, tiada sekutu bagi-Mu' },
]

const larangan = ['Memotong kuku atau rambut', 'Memakai wewangian', 'Menutup kepala (laki-laki)', 'Berburu binatang']

export default function GuidanceDetailScreen({ navigate }) {
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Hero */}
      <div className="relative pt-14 pb-8 px-5" style={{ background: 'linear-gradient(150deg, #0f3d22 0%, #1B5E35 50%, #2D7A4F 100%)' }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('guidance')} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft size={16} color="white" />
          </button>
          <span className="text-green-200 text-sm flex-1">Guidance Mandiri</span>
          <Bookmark size={20} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
            <Layers size={32} color="white" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-xs px-2 py-1 rounded-full font-medium text-white" style={{ background: 'linear-gradient(135deg, #B8944A, #D4A855)' }}>
              Wajib
            </span>
            <h2 className="text-white text-xl font-bold mt-1">Ihram &amp; Niat</h2>
            <p className="text-green-200 text-xs mt-0.5">Rukun pertama ibadah umrah</p>
          </div>
        </div>
      </div>

      {/* Audio player */}
      <div className="mx-5 -mt-4 rounded-2xl p-4 bg-white shadow-sm border border-gray-100 flex items-center gap-3 mb-4">
        <button className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
          <Play size={16} color="white" fill="white" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Volume2 size={13} color="#1B5E35" /> Dengarkan panduan audio
          </p>
          <div className="mt-2 bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full w-0 bg-green-700" />
          </div>
        </div>
        <span className="text-xs text-gray-400">3:42</span>
      </div>

      {/* Content */}
      <div className="px-5 space-y-5 mb-8">
        {/* Steps */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-3">Tata Cara</p>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white mt-0.5" style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
                  {i + 1}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Doa */}
        <div>
          <p className="text-sm font-bold text-gray-800 mb-3">Bacaan Talbiyah</p>
          <div className="space-y-3">
            {doaItems.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-right text-xl leading-loose mb-2" style={{ color: '#1B5E35', fontFamily: 'serif' }}>{d.arab}</p>
                <p className="text-xs text-gray-500 italic mb-1">{d.latin}</p>
                <p className="text-xs text-gray-700 font-medium">{d.arti}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Larangan */}
        <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #FFF8EC, #FFF4E5)' }}>
          <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#8B6914' }}>
            <AlertTriangle size={15} color="#B8944A" /> Larangan Saat Ihram
          </p>
          <div className="space-y-2">
            {larangan.map((l) => (
              <div key={l} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#B8944A' }} />
                <p className="text-xs" style={{ color: '#8B6914' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => navigate('guidance')}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #1B5E35, #2D7A4F)' }}>
          Lanjut ke Tawaf <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
