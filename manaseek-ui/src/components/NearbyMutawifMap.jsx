import { useEffect, useRef, useState } from 'react'
import { Hand, Loader2, LocateFixed, MapPin, Minus, Plus, UsersRound } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import mutawifArtwork from '../assets/home/services/mutawif.webp'
import './NearbyMutawifMap.css'

const NEARBY_ZOOM = 16
// Illustrative positions around the search point, not live provider coordinates.
// Pixel offsets at the initial zoom keep the icons readable on a phone.
const MARKER_SPOTS = [
  [-78, -71], [55, -55], [-95, 21],
  [68, 37], [-63, 96], [7, 110],
]

function hashId(id) {
  return Array.from(String(id)).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0)
}

function mutawifIcon() {
  const badge = document.createElement('span')
  badge.className = 'nearby-map-guide-badge'
  const image = document.createElement('img')
  image.src = mutawifArtwork
  image.alt = ''
  image.draggable = false
  badge.append(image)

  return L.divIcon({
    className: 'nearby-map-guide',
    html: badge,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  })
}

export default function NearbyMutawifMap({ position, mutawifs, status, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const tilesRef = useRef(null)
  const [tilesUnavailable, setTilesUnavailable] = useState(false)
  const { latitude, longitude, precise, label } = position
  const locationLabel = precise ? 'Kamu di sini' : label
  const available = status === 'ready' ? mutawifs.length : 0

  useEffect(() => {
    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      minZoom: 3,
      maxZoom: 19,
    })
    map.attributionControl.setPrefix(false)
    mapRef.current = map

    const loadedTiles = new Set()
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
      detectRetina: true,
      className: 'nearby-map-tiles',
    })
      .on('tileload', ({ tile }) => loadedTiles.add(tile))
      .on('tileunload', ({ tile }) => loadedTiles.delete(tile))
      .on('load', () => setTilesUnavailable(loadedTiles.size === 0))
      .addTo(map)
    tilesRef.current = tiles

    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      tiles.off()
      map.remove()
      mapRef.current = null
      tilesRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    map.setView([latitude, longitude], NEARBY_ZOOM, { animate: false })

    const marker = L.marker([latitude, longitude], {
      icon: L.divIcon({
        className: 'nearby-map-location',
        html: '<span class="nearby-map-location-dot"></span>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      interactive: false,
      keyboard: false,
      zIndexOffset: -1000,
    }).addTo(map)
    const tooltip = document.createElement('span')
    tooltip.textContent = locationLabel
    marker.bindTooltip(tooltip, {
      permanent: true,
      direction: 'bottom',
      offset: [0, 18],
      className: 'nearby-map-location-label',
    })

    return () => marker.remove()
  }, [latitude, longitude, locationLabel])

  useEffect(() => {
    if (status !== 'ready') return

    const map = mapRef.current
    const group = L.layerGroup().addTo(map)
    const origin = map.project([latitude, longitude], NEARBY_ZOOM)
    const horizontalScale = Math.min(1, map.getSize().x / 352)
    const usedSpots = new Set()
    // Stable IDs keep placements consistent across rerenders. Limit visible
    // icons to avoid crowding; the complete results remain in the list.
    const visible = mutawifs.slice(0, MARKER_SPOTS.length)
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))

    visible.forEach((mutawif) => {
      let spot = hashId(mutawif.id) % MARKER_SPOTS.length
      while (usedSpots.has(spot)) spot = (spot + 1) % MARKER_SPOTS.length
      usedSpots.add(spot)
      const [x, y] = MARKER_SPOTS[spot]
      const point = origin.add(L.point(x * horizontalScale, y))
      const marker = L.marker(map.unproject(point, NEARBY_ZOOM), {
        icon: mutawifIcon(),
        title: `Lihat profil ${mutawif.name || 'mutawif'} · posisi perkiraan`,
        riseOnHover: true,
      }).addTo(group)

      marker.getElement().setAttribute('aria-label', marker.options.title)
      marker.on('click', () => onSelect(mutawif.id))
    })

    return () => group.remove()
  }, [latitude, longitude, mutawifs, onSelect, status])

  const recenter = () => {
    mapRef.current?.setView([latitude, longitude], NEARBY_ZOOM, {
      animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    })
  }

  let summary = `${available} mutawif tersedia`
  if (status === 'loading') summary = 'Mencari mutawif…'
  else if (status === 'error') summary = 'Pencarian belum berhasil'
  else if (available === 0) summary = 'Belum ada mutawif online'

  return (
    <figure className="nearby-map" aria-label="Peta mutawif di sekitarmu">
      <div className="nearby-map-viewport">
        <div ref={containerRef} className="nearby-map-canvas" aria-label="Peta interaktif. Geser untuk menjelajah area." />

        <div className="nearby-map-summary" role="status">
          <span className="nearby-map-summary-icon" aria-hidden="true">
            {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : <UsersRound size={20} />}
          </span>
          <div>
            <p>Di sekitarmu</p>
            <span>{summary}</span>
          </div>
          {available > 0 && <span className="nearby-map-online" aria-hidden="true" />}
        </div>

        <div className="nearby-map-zoom" aria-label="Kontrol zoom peta">
          <button type="button" aria-label="Perbesar peta" onClick={() => mapRef.current?.zoomIn()}><Plus size={20} /></button>
          <button type="button" aria-label="Perkecil peta" onClick={() => mapRef.current?.zoomOut()}><Minus size={20} /></button>
        </div>

        <button type="button" className="nearby-map-recenter" onClick={recenter} aria-label="Kembali ke lokasi pencarian" title="Kembali ke lokasi pencarian">
          <LocateFixed size={21} />
        </button>

        {tilesUnavailable ? (
          <div className="nearby-map-hint nearby-map-hint--error" role="status">
            <span>Peta belum termuat.</span>
            <button type="button" onClick={() => tilesRef.current?.redraw()}>Coba lagi</button>
          </div>
        ) : (
          <div className="nearby-map-hint">
            {available > 0 ? <Hand size={14} aria-hidden="true" /> : <MapPin size={14} aria-hidden="true" />}
            <span>{available > 0 ? 'Ketuk mutawif untuk lihat profil' : 'Jelajahi area di sekitarmu'}</span>
          </div>
        )}
      </div>

      <figcaption className="nearby-map-caption">
        <div className="nearby-map-legend">
          <span><i className="nearby-map-legend-user" />{precise ? 'Lokasimu' : 'Titik pencarian'}</span>
          <span><i className="nearby-map-legend-guide" />Mutawif</span>
        </div>
        <p>{available > MARKER_SPOTS.length ? `${MARKER_SPOTS.length} ditampilkan · ` : ''}Posisi mutawif berupa perkiraan</p>
      </figcaption>
    </figure>
  )
}
