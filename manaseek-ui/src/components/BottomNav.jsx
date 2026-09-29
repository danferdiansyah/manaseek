import GlassIcon from './GlassIcon'

const TABS = [
  { id: 'home', label: 'Beranda', icon: 'home' },
  { id: 'guidance', label: 'Panduan', icon: 'hajj' },
  { id: 'chatbot', label: 'AI Chat', icon: 'chat' },
  { id: 'mutawif', label: 'Mutawif', icon: 'mutawif' },
  { id: 'profile', label: 'Profil', icon: 'profile' },
]

export default function BottomNav({ active, navigate }) {
  return (
    <nav aria-label="Navigasi utama" className="app-bottom-nav">
      {TABS.map(({ id, label, icon }) => (
        <button key={id} type="button" onClick={() => navigate(id)} aria-current={active === id ? 'page' : undefined}>
          <GlassIcon name={icon} size="nav" bare={active !== id} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
