import { useCallback, useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorState, Loading } from '../lib/ui'
import { useResource } from '../lib/useResource'

export default function ChecklistScreen({ navigate }) {
  const fetchChecklist = useCallback(() => api.get('/content/checklist'), [])
  const { status, data, error, reload } = useResource(fetchChecklist)

  // Local overlay so a tick feels instant; the server response is the truth.
  const [pending, setPending] = useState({})
  const [saveError, setSaveError] = useState(null)

  const toggle = async (item) => {
    const next = !(pending[item.id] ?? item.completed)
    setPending((prev) => ({ ...prev, [item.id]: next }))
    setSaveError(null)

    try {
      await api.put(`/content/checklist/${item.id}`, { completed: next })
    } catch (error) {
      // Roll the optimistic tick back and say so, rather than silently
      // leaving the screen disagreeing with the database.
      setPending((prev) => ({ ...prev, [item.id]: !next }))
      setSaveError(error.message ?? 'Gagal menyimpan perubahan')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-full bg-stone pt-24">
        <Loading label="Memuat checklist…" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-full bg-stone pt-24">
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }

  const items = data.items.map((item) => ({
    ...item,
    completed: pending[item.id] ?? item.completed,
  }))
  const completed = items.filter((item) => item.completed).length
  const percent = items.length === 0 ? 0 : Math.round((completed / items.length) * 100)

  return (
    <div className="flex flex-col min-h-full bg-stone">
      <div className="canopy px-5 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate('guidance')} className="glass-control w-9 h-9 rounded-full flex items-center justify-center">
            <ArrowLeft size={16} color="white" />
          </button>
          <h2 className="text-white font-bold text-lg">Checklist Persiapan</h2>
        </div>

        <div className="glass-canopy rounded-[20px] p-4">
          <p className="text-white font-semibold">{completed} dari {items.length} selesai</p>
          <div className="mt-3 bg-white/20 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #B8944A, #D4A855)' }}
            />
          </div>
          <p className="text-canopy-100/85 text-xs mt-1.5">Tersimpan otomatis di akunmu</p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-2 mb-10">
        {saveError && (
          <div className="rounded-[14px] p-3.5 text-sm mb-1" style={{ background: '#FDF0EF', border: '1px solid #F3D2CE', color: '#A8332B' }}>
            {saveError}
          </div>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item)}
            className="w-full flex items-start gap-3 glass rounded-[20px] p-4 text-left"
            style={{ borderColor: item.completed ? '#C3DFC9' : '#F3F4F6' }}
          >
            <div
              className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center flex-shrink-0 mt-0.5 border-2"
              style={item.completed
                ? { background: '#1B5E35', borderColor: '#1B5E35' }
                : { borderColor: '#B9C6bf', background: 'rgba(255,255,255,.7)' }}
            >
              {item.completed && <Check size={13} color="white" strokeWidth={3} />}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[15px] font-medium"
                style={{ color: item.completed ? '#9CA3AF' : '#374151', textDecoration: item.completed ? 'line-through' : 'none' }}
              >
                {item.title}
              </p>
              {item.description && <p className="text-xs text-ink-faint mt-0.5">{item.description}</p>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
