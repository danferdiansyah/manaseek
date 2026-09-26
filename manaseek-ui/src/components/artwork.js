import umrah from '../assets/home/services/umrah.webp'
import hajj from '../assets/home/services/hajj.webp'
import chat from '../assets/home/services/chat.webp'
import mutawif from '../assets/home/services/mutawif.webp'
import qibla from '../assets/home/services/qibla.webp'
import checklist from '../assets/home/services/checklist.webp'
import travel from '../assets/home/services/travel.webp'
import profile from '../assets/home/services/profile.webp'
import home from '../assets/illustrations/home.webp'
import ihram from '../assets/illustrations/ihram.webp'
import tawaf from '../assets/illustrations/tawaf.webp'
import notification from '../assets/illustrations/notification.webp'

export const artwork = { umrah, hajj, chat, mutawif, qibla, checklist, travel, profile, home, ihram, tawaf, notification }

const TOPIC_ARTWORK = {
  ClipboardList: 'travel', Layers: 'ihram', RotateCcw: 'tawaf',
  ArrowRightLeft: 'qibla', BookOpen: 'hajj', Scissors: 'ihram',
  Sunrise: 'hajj', Moon: 'hajj', Target: 'qibla', Heart: 'hajj',
}

export const topicArtwork = (icon) => TOPIC_ARTWORK[icon] ?? 'hajj'
export const serviceArtwork = (type) => ({
  IBADAH_GUIDANCE: 'hajj', MOBILITY_ASSISTANCE: 'mutawif', EMERGENCY: 'chat',
})[type] ?? 'mutawif'
