import { useState } from 'react'
import { initialsOf } from './format'

/** Keeps a stale or blocked remote avatar from becoming a broken-image icon. */
export default function Avatar({
  src,
  name,
  alt = '',
  imageClassName,
  fallbackClassName,
  imageStyle,
  fallbackStyle,
}) {
  const [failed, setFailed] = useState(false)

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        className={imageClassName}
        style={imageStyle}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div
      aria-hidden={!alt}
      className={fallbackClassName}
      style={fallbackStyle}
    >
      {initialsOf(name)}
    </div>
  )
}
