
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./NearbyShops.css";

const DEFAULT_LOCATION = [17.385, 78.486];

const shopIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, 14, { duration: 1.2 });
  }, [position, map]);

  return null;
}

function distanceBetween(a, b) {
  const rad = value => value * Math.PI / 180;
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) *
    Math.cos(rad(b[0])) *
    Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function NearbyShops() {
  const [position, setPosition] = useState(DEFAULT_LOCATION);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [radius, setRadius] = useState(5000);

  async function loadShops(location = position, searchRadius = radius) {
    setLoading(true);
    setError("");

    const query = `
      [out:json][timeout:25];
      (
        nwr(around:${searchRadius},${location[0]},${location[1]})
          ["shop"~"^(mobile_phone|computer|electronics)$"];
        nwr(around:${searchRadius},${location[0]},${location[1]})
          ["craft"~"^(electronics_repair|computer_repair)$"];
        nwr(around:${searchRadius},${location[0]},${location[1]})
          ["service:computer:repair"="yes"];
      );
      out center tags;
    `;

    try {
      const response = await fetch(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({ data: query })
        }
      );

      if (!response.ok) {
        throw new Error("Map service is temporarily unavailable.");
      }

      const data = await response.json();

      const results = data.elements
        .map(item => {
          const lat = item.lat ?? item.center?.lat;
          const lon = item.lon ?? item.center?.lon;

          if (lat == null || lon == null) return null;

          const tags = item.tags || {};
          const shopName = tags.name || "Unnamed repair shop";
          const type = tags.shop || tags.craft || "";

          return {
            id: `${item.type}-${item.id}`,
            name: shopName,
            type,
            lat,
            lon,
            phone: tags.phone || tags["contact:phone"] || "",
            address: [
              tags["addr:street"],
              tags["addr:suburb"],
              tags["addr:city"]
            ].filter(Boolean).join(", "),
            distance: distanceBetween(location, [lat, lon]),
            website: tags.website || tags["contact:website"] || ""
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);

      setShops(results);

      if (!results.length) {
        setError(
          "No mapped repair shops found nearby. Try increasing the search radius."
        );
      }
    } catch (err) {
      setError(err.message || "Unable to load repair shops.");
    } finally {
      setLoading(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async result => {
        const loc = [
          result.coords.latitude,
          result.coords.longitude
        ];

        setPosition(loc);
        await loadShops(loc, radius);
      },
      () => setError(
        "Location access denied. Allow location permission or use the default map."
      ),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  useEffect(() => {
    loadShops(DEFAULT_LOCATION, 5000);
  }, []);

  const filteredShops = shops.filter(shop => {
    if (category === "all") return true;

    if (category === "mobile") {
      return shop.type === "mobile_phone";
    }

    if (category === "laptop") {
      return ["computer", "computer_repair"].includes(shop.type);
    }

    return ["electronics", "electronics_repair"].includes(shop.type);
  });

  return (
    <div className="nearby-page">
      <div className="nearby-heading">
        <div>
          <p className="nearby-eyebrow">FIXIT LOCATOR</p>
          <h1>Find Repair Shops Near You</h1>
          <p>Discover nearby device repair services on the live map.</p>
        </div>

        <button className="location-btn" onClick={useMyLocation}>
          ◎ Use My Location
        </button>
      </div>

      <div className="nearby-toolbar">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="all">All Repair Shops</option>
          <option value="mobile">Mobile Repair</option>
          <option value="laptop">Laptop & Computer</option>
          <option value="electronics">Electronics Repair</option>
        </select>

        <select
          value={radius}
          onChange={e => {
            const next = Number(e.target.value);
            setRadius(next);
            loadShops(position, next);
          }}
        >
          <option value="1000">Within 1 km</option>
          <option value="3000">Within 3 km</option>
          <option value="5000">Within 5 km</option>
          <option value="10000">Within 10 km</option>
        </select>

        <button
          className="refresh-btn"
          onClick={() => loadShops(position, radius)}
          disabled={loading}
        >
          {loading ? "Searching..." : "↻ Refresh"}
        </button>
      </div>

      <div className="nearby-stats">
        <div>
          <span>Shops found</span>
          <strong>{filteredShops.length}</strong>
        </div>
        <div>
          <span>Search radius</span>
          <strong>{radius / 1000} km</strong>
        </div>
        <div>
          <span>Map status</span>
          <strong>{loading ? "Loading..." : "Ready"}</strong>
        </div>
      </div>

      {error && <p className="nearby-message">{error}</p>}

      <div className="nearby-layout">
        <section className="nearby-map">
          <MapContainer
            center={position}
            zoom={13}
            scrollWheelZoom
            style={{ height: "520px", width: "100%" }}
          >
            <RecenterMap position={position} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <Circle
              center={position}
              radius={radius}
              pathOptions={{
                color: "#36d6c3",
                fillColor: "#36d6c3",
                fillOpacity: 0.06
              }}
            />

            {filteredShops.map(shop => (
              <Marker
                key={shop.id}
                position={[shop.lat, shop.lon]}
                icon={shopIcon}
              >
                <Popup>
                  <strong>{shop.name}</strong>
                  <p>{shop.type || "Repair service"}</p>
                  <p>{shop.distance.toFixed(2)} km away</p>
                  {shop.phone && <p>Phone: {shop.phone}</p>}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lon}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get Directions
                  </a>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </section>

        <aside className="nearby-list">
          <h2>Nearby Shops</h2>
          <p className="nearby-list-subtitle">
            Sorted by distance
          </p>

          {filteredShops.map(shop => (
            <article className="shop-card" key={shop.id}>
              <div className="shop-card-top">
                <span className="shop-symbol">⚙</span>
                <span className="shop-distance">
                  {shop.distance.toFixed(1)} km
                </span>
              </div>

              <h3>{shop.name}</h3>
              <p>{shop.type.replaceAll("_", " ") || "Repair service"}</p>

              {shop.address && <p>📍 {shop.address}</p>}

              {shop.phone && (
                <a href={`tel:${shop.phone}`}>☎ {shop.phone}</a>
              )}

              <a
                className="directions-link"
                href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lon}`}
                target="_blank"
                rel="noreferrer"
              >
                Get Directions ↗
              </a>
            </article>
          ))}

          {!loading && !filteredShops.length && (
            <p>No matching shops found.</p>
          )}
        </aside>
      </div>

      <p className="nearby-attribution">
        Map data © OpenStreetMap contributors. Shop listings depend on
        available community-mapped data and may be incomplete.
      </p>
    </div>
  );
}
