import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Phone, Wrench } from "lucide-react";
import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { apiRequest } from "../lib/api";
import "../styles/shop-profile.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const imageUrl = (value) => value && (value.startsWith("http") || value.startsWith("data:")) ? value : `${API_BASE}${value || ""}`;

export default function ShopProfile() {
  const { sellerId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    apiRequest(`/api/marketplace/shops/${encodeURIComponent(sellerId)}`)
      .then(({ profile: shop }) => { if (mounted) setProfile(shop); })
      .catch((requestError) => { if (mounted) setError(requestError.message || "Unable to load this repair shop."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [sellerId]);

  if (loading) return <main className="public-shop-page"><p>Loading shop profile…</p></main>;
  if (error || !profile) return <main className="public-shop-page"><p role="alert">{error || "Repair shop not found."}</p><Link to="/">Back to FixIt</Link></main>;

  const hasCoordinates = Number.isFinite(profile.latitude) && Number.isFinite(profile.longitude);
  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${profile.latitude},${profile.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`;

  return (
    <main className="public-shop-page">
      <header className="public-shop-topbar"><Link to="/customer-dashboard"><ArrowLeft size={17} /> FixIt</Link><span>Repair shop profile</span></header>
      <section className="public-shop-cover" style={profile.coverImageUrl ? { backgroundImage: `linear-gradient(90deg,rgba(9,8,11,.82),rgba(9,8,11,.12)),url("${imageUrl(profile.coverImageUrl)}")` } : undefined}>
        <div className="public-shop-brand">{profile.logoUrl && <img src={imageUrl(profile.logoUrl)} alt={`${profile.shopName} logo`} />}<div><span className="eyebrow">LOCAL REPAIR PARTNER</span><h1>{profile.shopName}</h1><p>{profile.ownerName} · {profile.experienceYears} years in repair</p></div></div>
      </section>
      <div className="public-shop-content">
        <section className="public-shop-main">
          <article className="public-shop-panel"><span className="eyebrow">ABOUT THE SHOP</span><p>{profile.description || "This shop has not added a description yet."}</p></article>
          <article className="public-shop-panel"><span className="eyebrow">DEVICE CATEGORIES</span><div className="public-shop-tags">{profile.categories.length ? profile.categories.map((category) => <span key={category}>{category}</span>) : <p>Categories not listed.</p>}</div><h2>Repair services</h2><div className="public-shop-tags">{profile.services.length ? profile.services.map((service) => <span key={service}>{service}</span>) : <p>Services not listed.</p>}</div></article>
          {(profile.pricingInfo || profile.warrantyPolicy) && <article className="public-shop-panel"><span className="eyebrow">REPAIR INFORMATION</span>{profile.pricingInfo && <p><strong>Pricing:</strong> {profile.pricingInfo}</p>}{profile.warrantyPolicy && <p><strong>Warranty:</strong> {profile.warrantyPolicy}</p>}</article>}
          <article className="public-shop-panel"><span className="eyebrow">LOCATION</span><p><MapPin size={16} /> {profile.address}</p><a className="public-shop-link" href={directionsUrl} target="_blank" rel="noreferrer">Get directions <ArrowLeft size={15} /></a>
            {hasCoordinates && <div className="public-shop-map"><MapContainer center={[profile.latitude, profile.longitude]} zoom={14} scrollWheelZoom={false} style={{ height: 290, width: "100%" }}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" /><Marker position={[profile.latitude, profile.longitude]} /><Circle center={[profile.latitude, profile.longitude]} radius={350} pathOptions={{ color: "#D889AD", fillColor: "#D889AD", fillOpacity: 0.08 }} /></MapContainer></div>}
          </article>
        </section>
        <aside className="public-shop-contact public-shop-panel"><span className="eyebrow">CONTACT & HOURS</span>{profile.phone && <a href={`tel:${profile.phone}`}><Phone size={17} />{profile.phone}</a>}{profile.publicEmail && <a href={`mailto:${profile.publicEmail}`}>{profile.publicEmail}</a>}<div><Clock size={17} />{profile.openingHours.hoursText || "Hours not listed"}</div><Link className="public-shop-cta" to="/customer-dashboard"><Wrench size={16} /> Post a repair request</Link></aside>
      </div>
    </main>
  );
}
