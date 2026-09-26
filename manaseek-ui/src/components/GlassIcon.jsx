import { artwork } from './artwork'

/** Decorative artwork: the adjacent label supplies the accessible name. */
export default function GlassIcon({ name, tone = 'green', size = 'md', bare = false, className = '' }) {
  return (
    <span className={`glass-icon glass-icon--${size} glass-icon--${tone} ${bare ? 'glass-icon--bare' : ''} ${className}`} aria-hidden="true">
      <img src={artwork[name] ?? artwork.hajj} alt="" width="192" height="192" decoding="async" draggable="false" />
    </span>
  )
}
