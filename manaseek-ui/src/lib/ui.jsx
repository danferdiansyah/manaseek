import { AlertCircle, Loader2 } from 'lucide-react'
import GlassIcon from '../components/GlassIcon'

export function Loading({ label = 'Memuat…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4" role="status" aria-live="polite">
      <GlassIcon name="umrah" size="hero" />
      <p className="flex items-center gap-2 text-sm text-ink-soft"><Loader2 size={16} className="animate-spin" aria-hidden="true" />{label}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="app-state flex flex-col items-center justify-center py-10 px-6 gap-2 text-center" role="alert">
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

export function EmptyState({ title, description, icon = 'travel' }) {
  return (
    <div className="app-state flex flex-col items-center justify-center py-10 px-6 gap-2 text-center">
      <GlassIcon name={icon} size="hero" tone="sage" className="mb-3" />
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="text-xs text-ink-faint leading-relaxed">{description}</p>}
    </div>
  )
}
