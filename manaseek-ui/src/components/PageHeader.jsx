import { ArrowLeft } from 'lucide-react'
import GlassIcon from './GlassIcon'
import mark from '../assets/home/manaseek-mark.png'

export default function PageHeader({ title, eyebrow, description, icon, onBack, action, children }) {
  return (
    <header className="page-header canopy">
      <div className="page-header-top">
        {onBack ? (
          <button type="button" onClick={onBack} className="page-back glass-control" aria-label="Kembali">
            <ArrowLeft size={19} aria-hidden="true" />
          </button>
        ) : <img className="page-brand" src={mark} width="38" height="38" alt="Manaseek" />}
        {action ?? (onBack && <img className="page-brand" src={mark} width="38" height="38" alt="Manaseek" />)}
      </div>
      <div className="page-header-intro">
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {icon && <GlassIcon name={icon} size="hero" className="page-header-art" />}
      </div>
      {children && <div className="page-header-content">{children}</div>}
    </header>
  )
}
