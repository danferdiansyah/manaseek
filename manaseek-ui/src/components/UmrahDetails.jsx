import { Check, Plane, Hotel, MapPin, Utensils, Info } from 'lucide-react'
import '../screens/umrah.css'

export function UmrahDemoNotice() {
  return <p className="umrah-demo"><Info size={16} aria-hidden="true" /><span>Paket & pembayaran simulasi. Tidak ada dana ditagihkan atau tiket sungguhan diterbitkan.</span></p>
}

export default function UmrahDetails({ details }) {
  return (
    <div className="umrah-details">
      <section className="umrah-section">
        <h2><Plane size={18} aria-hidden="true" /> Tiket pesawat pergi–pulang</h2>
        {details.flights.map((flight) => (
          <div className="umrah-flight" key={flight.direction}>
            <p className="umrah-overline">{flight.direction === 'OUTBOUND' ? 'Keberangkatan' : 'Kepulangan'} · {flight.cabin}</p>
            <strong>{flight.airline}</strong><p>{flight.flightNumber} · {flight.transit}</p>
            <div className="umrah-flight-route">
              <div><b>{flight.departureTime}</b><span>{flight.from}</span><small>Hari {flight.day}</small></div>
              <Plane size={18} aria-hidden="true" />
              <div><b>{flight.arrivalTime}</b><span>{flight.to}</span><small>Hari {flight.arrivalDay}</small></div>
            </div>
            <p>{flight.baggage}</p>
          </div>
        ))}
      </section>
      <section className="umrah-section">
        <h2><Hotel size={18} aria-hidden="true" /> Hotel selama perjalanan</h2>
        {details.hotels.map((hotel) => (
          <div className="umrah-hotel" key={hotel.city}>
            <div className="umrah-card-row"><span className="umrah-tag">{hotel.city}</span><span className="umrah-stars" aria-label={`${hotel.stars} bintang`}>{'★'.repeat(hotel.stars)}</span></div>
            <h3>{hotel.name}</h3><p>{hotel.nights} malam</p>
            <p><MapPin size={13} aria-hidden="true" /> ±{hotel.distanceMeters} m dari {hotel.landmark}</p>
            <p><Utensils size={13} aria-hidden="true" /> {hotel.mealPlan}</p>
          </div>
        ))}
      </section>
      <section className="umrah-section">
        <h2>Sudah termasuk</h2>
        <ul className="umrah-inclusions">{details.included.map((item) => <li key={item}><Check size={15} aria-hidden="true" /><span>{item}</span></li>)}</ul>
        <h3 className="umrah-subheading">Belum termasuk</h3>
        <ul className="umrah-exclusions">{details.excluded.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="umrah-section">
        <h2>Rencana perjalanan</h2>
        <ol className="umrah-itinerary">{details.itinerary.map((step) => (
          <li key={step.days}><small>{step.days}</small><h3>{step.title}</h3><p>{step.description}</p></li>
        ))}</ol>
      </section>
    </div>
  )
}
