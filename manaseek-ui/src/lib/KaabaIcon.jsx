/**
 * The Kaaba, drawn rather than borrowed: the icon set has no such glyph, and a
 * generic mosque or compass would not say what this points at.
 *
 * Kept to three readable parts so it still holds at 18px: the building, the
 * kiswah band across the upper third, and the door.
 */
export default function KaabaIcon({
  size = 24,
  color = '#14261C',
  bandColor = '#D4A855',
  doorColor = '#D4A855',
}) {
  const band = bandColor
  const door = doorColor

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="4.5" width="16" height="15" rx="1.6" fill={color} />
      <rect x="4" y="9" width="16" height="2.6" fill={band} />
      <rect x="10.6" y="13.4" width="2.8" height="6.1" rx="0.5" fill={door} />
    </svg>
  )
}
