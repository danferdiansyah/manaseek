export const ROOM_TYPES = [
  { id: 'QUAD', label: 'Quad', capacity: 4, supplement: null },
  { id: 'TRIPLE', label: 'Triple', capacity: 3, supplement: 'tripleSupplement' },
  { id: 'DOUBLE', label: 'Double', capacity: 2, supplement: 'doubleSupplement' },
]

export const umrahDate = (value) => new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(new Date(value))

export function umrahUnitPrice(pkg, roomType) {
  const room = ROOM_TYPES.find((item) => item.id === roomType)
  return Number(pkg.basePrice) + Number(room?.supplement ? pkg[room.supplement] : 0)
}
