import GlassIcon from './GlassIcon'

const TABS = [
  { id: 'home', label: 'Beranda', icon: 'home' },
  { id: 'guidance', label: 'Panduan', icon: 'hajj' },
  { id: 'umrah-packages', label: 'Umroh', accessibleLabel: 'Paket Umroh', icon: 'umrah' },
  { id: 'chatbot', label: 'AI Chat', icon: 'chat' },
  { id: 'mutawif', label: 'Mutawif', icon: 'mutawif' },
  { id: 'profile', label: 'Profil', icon: 'profile' },
]

export default function BottomNav({ active, navigate }) {
  return (
    <nav aria-label="Navigasi utama" className="app-bottom-nav" style={{ '--nav-columns': TABS.length }}>
      {TABS.map(({ id, label, accessibleLabel, icon }) => (
        <button key={id} type="button" data-tab={id} aria-label={accessibleLabel} onClick={() => navigate(id)} aria-current={active === id ? 'page' : undefined}>
          <GlassIcon name={icon} size="nav" bare={active !== id} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
