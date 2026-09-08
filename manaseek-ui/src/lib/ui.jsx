import { AlertCircle, Loader2 } from 'lucide-react'

export function Loading({ label = 'Memuat…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <Loader2 size={22} className="animate-spin" color="#1B5E35" />
      <p className="text-xs text-ink-faint">{label}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 gap-2 text-center">
      <AlertCircle size={22} color="#DC2626" />
      <p className="text-sm font-semibold text-ink">Gagal memuat</p>
      <p className="text-xs text-ink-soft leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: '#1B5E35' }}
        >
          Coba lagi
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 gap-1 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="text-xs text-ink-faint leading-relaxed">{description}</p>}
    </div>
  )
}
