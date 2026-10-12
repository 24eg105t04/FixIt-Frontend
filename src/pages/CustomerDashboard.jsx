import React, { useState } from "react";
import FixItThemeSwitcher from "../components/ui/FixItThemeSwitcher";
import { apiRequest } from "../lib/api";

import {

  Wrench, LayoutDashboard, Camera, MapPin, GitCompare,

  BrainCircuit, ClipboardCheck, Search, Bell, LogOut,

  Upload, Smartphone, Laptop, Tablet, ArrowRight, Clock,

  CheckCircle2, Navigation, Send,

  ImagePlus, ShieldCheck, X, Lightbulb, Headphones, Menu, UserRound,

} from "lucide-react";

import { useAuth } from "../AuthContext";

import { useNavigate } from "react-router-dom";

import "../styles/repair-dashboard.css";

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

const navigation = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "report", label: "Post a Repair", icon: Camera },
  { id: "nearby", label: "Find Shops", icon: MapPin },
  { id: "repairs", label: "My Requests", icon: ClipboardCheck },
  { id: "ai", label: "AI Repair Assistant", icon: BrainCircuit },
  { id: "quotes", label: "Compare Bids", icon: GitCompare },
  { id: "youfix", label: "Repair Guides", icon: Wrench },
];

function money(amount) {

  return `₹${amount.toLocaleString("en-IN")}`;

}

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

// Approximate starting view for Jodimetla; Search area geocodes the exact locality.
const defaultMapPosition = [17.421, 78.657];

const repairShopIcon = new L.Icon({

  iconUrl:

    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  iconRetinaUrl:

    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  shadowUrl:

    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34]

});

function MapRecenter({ position }) {

  const map = useMap();

  React.useEffect(() => {

    map.flyTo(position, 14, { duration: 1 });

  }, [position, map]);

  return null;

}

function getDistanceKm(origin, destination) {

  const radians = value => value * Math.PI / 180;

  const dLat = radians(destination[0] - origin[0]);

  const dLon = radians(destination[1] - origin[1]);

  const a =

    Math.sin(dLat / 2) ** 2 +

    Math.cos(radians(origin[0])) *

    Math.cos(radians(destination[0])) *

    Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

}

export default function CustomerDashboard() {

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const [active, setActive] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");

  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [publicShops, setPublicShops] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const [deviceType, setDeviceType] = useState("Phone");

  const [deviceBrand, setDeviceBrand] = useState("");

  const [deviceModel, setDeviceModel] = useState("");

  const [issue, setIssue] = useState("");

  const [description, setDescription] = useState("");

  const [location, setLocation] = useState("");

  const [photo, setPhoto] = useState(null);

  const [notice, setNotice] = useState("");

  const [quoteFilter, setQuoteFilter] = useState("All");

  const [selectedQuote, setSelectedQuote] = useState(null);

  const [aiQuestion, setAiQuestion] = useState("");

  const [aiMessages, setAiMessages] = useState([

    {

      from: "ai",

      text: "Hi! I'm FixIt AI. Tell me what is wrong with your device, and I'll help you understand possible causes and next steps.",

    },

  ]);

  const [mapPosition, setMapPosition] = useState(defaultMapPosition);
  const [mapSearchLocation, setMapSearchLocation] = useState("Jodimetla, Hyderabad, Telangana, India");
  const [liveShops, setLiveShops] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState("");
  const [shopCategory, setShopCategory] = useState("all");
  const [searchRadius, setSearchRadius] = useState(5000);

  const name = user?.name || "there";

  React.useEffect(() => {
    if (active !== "quotes" || !selectedRequestId) return undefined;
    const refresh = async () => {
      try {
        const result = await apiRequest(`/api/marketplace/requests/${encodeURIComponent(selectedRequestId)}/bids`);
        setQuotes((result.bids || []).map((bid) => ({
          ...bid,
          shopDetails: bid.shop,
          shop: bid.shop.shopName,
          issue: bid.notes || "Repair proposal",
          time: `${bid.estimatedHours} hours`,
        })));
        setQuoteError("");
      } catch (error) {
        setQuoteError(error.message || "Unable to refresh bids.");
      }
    };
    const interval = window.setInterval(refresh, 15000);
    return () => window.clearInterval(interval);
  }, [active, selectedRequestId]);

  React.useEffect(() => {
    let mounted = true;
    Promise.all([
      apiRequest("/api/marketplace/requests/mine"),
      apiRequest("/api/marketplace/jobs/mine"),
      apiRequest("/api/marketplace/shops"),
    ]).then(([requestData, jobData, shopData]) => {
      if (!mounted) return;
      setRequests(requestData.requests || []);
      setJobs(jobData.jobs || []);
      setPublicShops(shopData.shops || []);
      setDataError("");
    }).catch((error) => {
      if (mounted) setDataError(error.message || "Unable to load your FixIt marketplace data.");
    }).finally(() => {
      if (mounted) setDataLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  function changeSection(section) {

    setActive(section);

    setNotice("");

    setMobileNavOpen(false);

    window.scrollTo({ top: 0, behavior: "smooth" });

  }

  function handleLogout() {

    logout();

    navigate("/login", { replace: true });

  }

  function chooseDeviceCategory(category) {
    setDeviceType(category);
    setIssue("");
    changeSection("report");
  }

  async function loadBidsForRequest(requestId) {
    if (!requestId) {
      setSelectedRequestId("");
      setQuotes([]);
      setSelectedQuote(null);
      setQuoteError("");
      return;
    }
    setSelectedRequestId(requestId);
    setQuotes([]);
    setSelectedQuote(null);
    setQuoteError("");
    setQuotesLoading(true);
    try {
      const result = await apiRequest(`/api/marketplace/requests/${encodeURIComponent(requestId)}/bids`);
      setQuotes((result.bids || []).map((bid) => ({
        ...bid,
        shopDetails: bid.shop,
        shop: bid.shop.shopName,
        issue: bid.notes || "Repair proposal",
        time: `${bid.estimatedHours} hours`,
      })));
      setActive("quotes");
      setNotice("");
    } catch (error) {
      setQuoteError(error.message || "Unable to load bids for this request.");
      setActive("quotes");
    } finally {
      setQuotesLoading(false);
    }
  }

  function handlePhoto(event) {

    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

      setNotice("Please choose an image file.");

      return;

    }

    if (file.size > 5 * 1024 * 1024) {

      setNotice("Please choose an image smaller than 5 MB.");

      return;

    }

    setPhoto(file);

    setNotice("");

  }

  async function submitRepair(event) {
    event.preventDefault();
    if (!deviceType || !issue.trim() || !location.trim()) {
      setNotice("Please select a device, choose an issue, and enter your locality.");
      return;
    }

    setDataError("");
    try {
      const photos = photo ? [await fileAsDataUrl(photo)] : [];
      const { request } = await apiRequest("/api/marketplace/requests", {
        method: "POST",
        body: {
          deviceCategory: deviceType,
          brand: deviceBrand.trim(),
          model: deviceModel.trim(),
          issue: issue.trim(),
          description: description.trim(),
          location: location.trim(),
          photos,
        },
      });
      setRequests((previous) => [request, ...previous]);
      setDeviceBrand("");
      setDeviceModel("");
      setIssue("");
      setDescription("");
      setLocation("");
      setPhoto(null);
      setNotice("Your repair request is now open to eligible repair shops.");
      setActive("repairs");
    } catch (error) {
      setNotice(error.message || "Unable to submit your repair request.");
    }
  }

async function askAI(event) {

  event.preventDefault();

  const question = aiQuestion.trim();

  if (!question) return;

  setAiMessages((previous) => [

    ...previous,

    { from: "user", text: question },

  ]);

  setAiQuestion("");

  try {

    const data = await apiRequest("/api/ai/chat", { method: "POST", body: { question } });

    setAiMessages((previous) => [

      ...previous,

      { from: "ai", text: data.answer },

    ]);

  } catch (error) {

    setAiMessages((previous) => [

      ...previous,

      {

        from: "ai",

        text: error.message || "Unable to connect to FixIt AI.",

      },

    ]);

  }

}

  async function acceptQuote(quote) {
    try {
      const result = await apiRequest(`/api/marketplace/bids/${encodeURIComponent(quote.id)}/accept`, { method: "POST" });
      setSelectedQuote(quote);
      const { jobs: currentJobs } = await apiRequest("/api/marketplace/jobs/mine");
      setJobs(currentJobs || []);
      setRequests((previous) => previous.map((request) => request.id === selectedRequestId ? { ...request, status: "ACCEPTED" } : request));
      setNotice(`Bid accepted. Repair ${result.job.id} is now assigned to ${quote.shop || "the selected shop"}.`);
      setQuotes((previous) => previous.map((bid) => ({ ...bid, status: bid.id === quote.id ? "ACCEPTED" : "REJECTED" })));
    } catch (error) {
      setNotice(error.message || "Unable to accept this bid.");
    }
  }

  async function fetchShopsForCoordinates(center) {
    // Query multiple OpenStreetMap tags because repair businesses are not all tagged the same way.
    const query = `
      [out:json][timeout:30];
      (
        nwr(around:${searchRadius},${center[0]},${center[1]})["shop"~"^(mobile_phone|computer|electronics)$"];
        nwr(around:${searchRadius},${center[0]},${center[1]})["craft"~"^(electronics_repair|computer_repair)$"];
        nwr(around:${searchRadius},${center[0]},${center[1]})["mobile_phone:repair"="yes"];
        nwr(around:${searchRadius},${center[0]},${center[1]})["computer:repair"="yes"];
        nwr(around:${searchRadius},${center[0]},${center[1]})["service:electronics_repair"="yes"];
      );
      out center tags;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({ data: query })
    });

    if (!response.ok) {
      throw new Error("The OpenStreetMap search service is busy. Please wait a moment and try Refresh results.");
    }

    const data = await response.json();
    const unique = new Map();
    (data.elements || []).forEach((item) => {
      const lat = item.lat ?? item.center?.lat;
      const lon = item.lon ?? item.center?.lon;
      if (lat == null || lon == null) return;

      const tags = item.tags || {};
      const rawType = tags.shop || tags.craft || "electronics_repair";
      let category = "electronics";
      let repairType = "electronics";
      if (rawType === "mobile_phone" || tags["mobile_phone:repair"] === "yes") {
        category = "mobile_phone";
        repairType = "phone";
      } else if (rawType === "computer" || rawType === "computer_repair" || tags["computer:repair"] === "yes") {
        category = "computer";
        repairType = "computer";
      }

      const shop = {
        id: `${item.type}-${item.id}`,
        name: tags.name || `${category === "mobile_phone" ? "Mobile phone" : category === "computer" ? "Computer" : "Electronics"} repair shop`,
        type: category,
        repairType,
        lat: Number(lat),
        lon: Number(lon),
        phone: tags.phone || tags["contact:phone"] || "",
        address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(", "),
        distance: getDistanceKm(center, [Number(lat), Number(lon)])
      };
      unique.set(shop.id, shop);
    });

    const results = [...unique.values()].sort((a, b) => a.distance - b.distance);
    setLiveShops(results);
    if (!results.length) {
      setMapError("No repair shops were found in OpenStreetMap data for this area and radius. Try 10 km or choose All shops; some local shops may not be mapped.");
    }
  }

  async function searchRepairShops() {
    setMapLoading(true);
    setMapError("");

    try {
      let center = mapPosition;

      if (mapSearchLocation.trim()) {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(mapSearchLocation.trim())}`
        );

        if (!geoResponse.ok) {
          throw new Error("Unable to search that location. Please try again.");
        }

        const places = await geoResponse.json();
        if (!places.length) {
          throw new Error("Location not found. Try including the city, for example Jodimetla, Hyderabad.");
        }

        center = [Number(places[0].lat), Number(places[0].lon)];
        setMapPosition(center);
      } else if (!liveShops.length) {
        throw new Error("Enter a locality or use My Location before searching.");
      }

      await fetchShopsForCoordinates(center);
    } catch (error) {
      setLiveShops([]);
      setMapError(error.message || "Unable to load nearby repair shops.");
    } finally {
      setMapLoading(false);
    }
  }

  function findMyLocation() {
    if (!navigator.geolocation) {
      setMapError("Your browser does not support location access.");
      return;
    }

    setMapLoading(true);
    setMapError("");

    navigator.geolocation.getCurrentPosition(
      async (result) => {
        const center = [result.coords.latitude, result.coords.longitude];
        setMapPosition(center);
        setMapSearchLocation("");

        try {
          await fetchShopsForCoordinates(center);
        } catch (error) {
          setLiveShops([]);
          setMapError(error.message || "Unable to load nearby repair shops.");
        } finally {
          setMapLoading(false);
        }
      },
      () => {
        setMapLoading(false);
        setMapError("Location permission was denied. Enter your area in the search field instead.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const filteredShops = liveShops.filter((shop) => {
    if (shopCategory === "all") return true;
    if (shopCategory === "mobile_phone") return shop.type === "mobile_phone" || shop.repairType === "phone";
    if (shopCategory === "computer") return shop.type === "computer" || shop.repairType === "computer";
    return shop.type === "electronics" || shop.type === "electronics_repair";
  });

  const matchingRequests = requests.filter((request) =>
    `${request.id} ${request.device} ${request.issue} ${request.status}`
      .toLowerCase().includes(headerSearch.trim().toLowerCase())
  );

  return (

    <div className="repair-app">

      <aside className={`repair-sidebar ${mobileNavOpen ? "nav-open" : ""}`}>

        <a className="repair-brand" href="#overview" onClick={(event) => {

          event.preventDefault();

          changeSection("overview");

        }}>

          <span className="repair-brand-icon"><Wrench size={22} /></span>

          <span>FixIt<small>DEVICE CARE PLATFORM</small></span>

        </a>

        <div className="repair-side-label">WORKSPACE</div>

        <nav className="repair-nav">

          {navigation.map((item) => {

            const Icon = item.icon;

            return (

              <button

                key={item.id}

                className={`repair-nav-item ${active === item.id ? "active" : ""}`}

                onClick={() => {
  if (item.id === "youfix") {
    navigate("/youfix");
  } else {
    changeSection(item.id);
  }
}}

              >

                <Icon size={19} />

                <span>{item.label}</span>

                {item.id === "quotes" && (

                  <span className="repair-nav-count">3</span>

                )}

              </button>

            );

          })}

        </nav>

        <div className="repair-sidebar-help">

          <div className="repair-help-icon"><ShieldCheck size={21} /></div>

          <strong>Repair with confidence</strong>

          <p>Compare local professionals before choosing your repair.</p>

          <button onClick={() => changeSection("nearby")}>

            Find a repair shop <ArrowRight size={15} />

          </button>

        </div>

        <div className="repair-profile">

          <div className="repair-avatar">

            {name.charAt(0).toUpperCase()}

          </div>

          <div className="repair-profile-text">

            <strong>{name}</strong>

            <span>Customer account</span>

          </div>

          <button className="repair-icon-button" onClick={handleLogout} title="Log out">

            <LogOut size={17} />

          </button>

        </div>

      </aside>

      <main className="repair-main">

        <header className="repair-topbar">

          <div className="repair-breadcrumb">

            <span>FixIt</span><span>/</span>

            <strong>{navigation.find((item) => item.id === active)?.label}</strong>

          </div>

          <div className="repair-top-actions">

            <label className="repair-header-search">
              <Search size={17} />
              <input
                aria-label="Search repair requests"
                value={headerSearch}
                onChange={(event) => setHeaderSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") changeSection("repairs");
                }}
                placeholder="Search requests"
              />
            </label>
             <FixItThemeSwitcher />
            <span className="repair-demo-badge"><span /> FRONTEND DEMO</span>

            <button className="repair-icon-button" title="Notifications" onClick={() => setNotice("You’re all caught up. Notifications will appear here when repair updates are connected.")}>

              <Bell size={19} />

            </button>

            <div className="repair-profile-menu-wrap">
              <button
                className="repair-top-avatar"
                type="button"
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
                onClick={() => setProfileMenuOpen((open) => !open)}
              >{name.charAt(0).toUpperCase()}</button>
              {profileMenuOpen && (
                <div className="repair-profile-menu">
                  <strong>{name}</strong>
                  <span>Customer account</span>
                  <button type="button" onClick={() => { setNotice("Account settings are managed by your FixIt profile."); setProfileMenuOpen(false); }}><UserRound size={15} /> Settings</button>
                  <button type="button" onClick={handleLogout}><LogOut size={15} /> Log out</button>
                </div>
              )}
            </div>
            <button
              type="button"
              className="repair-mobile-toggle"
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >{mobileNavOpen ? <X size={20} /> : <Menu size={20} />}</button>

          </div>

        </header>

        {notice && (

          <div className="repair-notice" role="status">

            <CheckCircle2 size={18} />

            <span>{notice}</span>

            <button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={16} /></button>

          </div>

        )}

        {dataError && <div className="repair-data-state" role="alert">{dataError}</div>}

        {active === "overview" && (

          <section className="repair-content">

            <div className="repair-welcome">

              <div>

                <span className="repair-eyebrow">YOUR DEVICE CARE, SIMPLIFIED</span>

                <h1>Your Devices Deserve <span>a Second Life.</span></h1>

                <p>Good to see you, {name}. Get clear repair options, compare local expertise, and make your next move with confidence.</p>

              </div>

              <div className="repair-welcome-mark"><Wrench size={45} /></div>

            </div>

            <div className="repair-hero">

              <div className="repair-hero-copy">

                <span className="repair-hero-label">CARE THAT KEEPS YOU CONNECTED</span>

                <h2>Make repair the<br />smarter next step.</h2>

                <p>Describe the issue, connect with nearby experts, and compare repair offers in one place.</p>

                <button className="repair-button repair-button-light" onClick={() => changeSection("report")}>

                  Post a Repair <ArrowRight size={17} />

                </button>
                <button className="repair-button repair-button-light repair-hero-secondary" onClick={() => changeSection("nearby")}>
                  Explore Repair Shops <MapPin size={16} />
                </button>

              </div>

              <div className="repair-hero-art">

                <div className="repair-orbit repair-orbit-one" />

                <div className="repair-orbit repair-orbit-two" />

                <div className="repair-device-illustration">

                  <Smartphone size={76} strokeWidth={1.1} />

                  <Wrench size={32} />

                </div>

                <span className="repair-art-dot repair-art-dot-one" />

                <span className="repair-art-dot repair-art-dot-two" />

              </div>

            </div>

            <section className="repair-category-section" aria-labelledby="repair-categories-title">
              <div className="repair-section-heading">
                <div><h2 id="repair-categories-title">What needs a little care?</h2><p>Choose a device to start a repair request.</p></div>
              </div>
              <div className="repair-category-grid">
                {[
                  { name: "Phones", type: "Phone", Icon: Smartphone },
                  { name: "Laptops", type: "Laptop", Icon: Laptop },
                  { name: "Tablets", type: "Tablet", Icon: Tablet },
                  { name: "Headphones", type: "Headphones", Icon: Headphones },
                  { name: "Other Gadgets", type: "Other gadgets", Icon: Wrench },
                ].map(({ name: categoryName, type, Icon }) => (
                  <button key={type} className="repair-category-card" onClick={() => chooseDeviceCategory(type)}>
                    <span><Icon size={21} /></span>
                    <strong>{categoryName}</strong>
                    <ArrowRight size={15} />
                  </button>
                ))}
              </div>
            </section>

            <div className="repair-section-heading">

              <div><h2>Your repair overview</h2><p>A quick look at your device-care activity.</p></div>

              <button className="repair-text-button" onClick={() => changeSection("repairs")}>View all repairs <ArrowRight size={15} /></button>

            </div>

            <div className="repair-stat-grid">

              <div className="repair-stat-card">

                <span className="repair-stat-icon"><ClipboardCheck size={20} /></span>

                <span className="repair-stat-label">Total requests</span>

                <strong>{requests.length}</strong>

                <small>Repair requests created</small>

              </div>

              <div className="repair-stat-card">

                <span className="repair-stat-icon"><GitCompare size={20} /></span>

                <span className="repair-stat-label">Quotes available</span>

                <strong>3</strong>

                <small>Demo offers to compare</small>

              </div>

              <div className="repair-stat-card">

                <span className="repair-stat-icon"><Wrench size={20} /></span>

                <span className="repair-stat-label">In progress</span>

                <strong>{requests.filter((r) => r.status === "In progress").length}</strong>

                <small>Active repair jobs</small>

              </div>

              <div className="repair-stat-card">

                <span className="repair-stat-icon"><MapPin size={20} /></span>

                <span className="repair-stat-label">Nearby shops</span>

                <strong>{publicShops.length}</strong>

                <small>Sample local listings</small>

              </div>

            </div>

            <div className="repair-two-column">

              <div className="repair-panel">

                <div className="repair-panel-heading">

                  <div><h3>Recent repair requests</h3><p>Follow your device's repair journey.</p></div>

                  <button className="repair-round-arrow" onClick={() => changeSection("repairs")}><ArrowRight size={17} /></button>

                </div>

                <div className="repair-request-list">

                  {matchingRequests.slice(0, 3).map((request) => (

                    <div className="repair-request-row" key={request.id}>

                      <div className="repair-device-icon"><Smartphone size={21} /></div>

                      <div className="repair-request-info">

                        <strong>{request.issue}</strong>

                        <span>{request.device} · {request.id}</span>

                      </div>

                      <div className="repair-request-right">

                        <span className={`repair-status ${request.status === "In progress" ? "status-progress" : ""}`}>{request.status}</span>

                        <small>{request.date}</small>

                      </div>

                    </div>

                  ))}

                </div>

              </div>

              <div className="repair-panel repair-nearby-panel">

                <div className="repair-panel-heading">

                  <div><h3>Repair shops near you</h3><p>Explore published FixIt shop profiles.</p></div>

                  <button className="repair-round-arrow" onClick={() => changeSection("nearby")}><ArrowRight size={17} /></button>

                </div>

                {publicShops.slice(0, 2).map((shop) => (

                  <div className="repair-mini-shop" key={shop.id}>

                    <div className="repair-shop-avatar"><Wrench size={20} /></div>

                    <div className="repair-mini-shop-info">

                      <strong>{shop.shopName}</strong>

                      <span>{shop.categories.join(" · ") || shop.address}</span>

                    </div>

                    <a className="repair-shop-profile-link" href={`/shops/${shop.sellerId}`} aria-label={`View ${shop.shopName} profile`}><ArrowRight size={15} /></a>

                  </div>

                ))}

                <button className="repair-outline-button repair-full-button" onClick={() => changeSection("nearby")}>

                  Explore nearby shops <MapPin size={16} />

                </button>

              </div>

            </div>

          </section>

        )}

        {active === "report" && (

          <section className="repair-content">

            <div className="repair-page-heading">

              <span className="repair-eyebrow">START A REPAIR</span>

              <h1>Tell us what needs <span>fixing.</span></h1>

              <p>Share a few details so suitable repair shops can understand your issue.</p>

            </div>

            <form className="repair-form-panel" onSubmit={submitRepair}>

              <div className="repair-form-section-title"><span>01</span><div><h3>Your device</h3><p>Choose the device you need help with.</p></div></div>

              <div className="repair-device-types">

                {[

                  { name: "Phone", Icon: Smartphone },

                  { name: "Laptop", Icon: Laptop },

                  { name: "Tablet", Icon: Tablet },

                  { name: "Headphones", Icon: Headphones },

                  { name: "Other gadgets", Icon: Wrench },

                ].map(({ name, Icon }) => (

                  <button type="button" key={name} onClick={() => {

  setDeviceType(name);

  setIssue("");

}} className={`repair-device-choice ${deviceType === name ? "selected" : ""}`}>

                    <Icon size={24} /><span>{name}</span>

                    {deviceType === name && <CheckCircle2 size={16} />}

                  </button>

                ))}

              </div>

              <div className="repair-input-grid">

                <label>Brand (optional)

                  <input value={deviceBrand} onChange={(e) => setDeviceBrand(e.target.value)} placeholder="e.g. Apple, Samsung, HP" />

                </label>

                <label>Model (optional)

                  <input value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} placeholder="e.g. iPhone 14, Pavilion" />

                </label>

              </div>

              <div className="repair-form-section-title"><span>02</span><div><h3>Describe the damage</h3><p>More detail helps shops prepare a relevant quotation.</p></div></div>

              <label className="repair-field-label">

                What seems to be wrong? *

                <select

                  value={issue}

                  onChange={(event) => setIssue(event.target.value)}

                  required

                >

                  <option value="">Select the main issue</option>

                  {(deviceType === "Phone"

                    ? [

                        "Cracked screen or display",

                        "Battery draining quickly",

                        "Charging port problem",

                        "Camera not working",

                        "Speaker or microphone problem",

                        "Water damage",

                        "Phone not turning on",

                        "Network or SIM problem",

                        "Software or app problem",

                        "Other phone issue",

                      ]

                    : deviceType === "Laptop"

                    ? [

                        "Laptop not turning on",

                        "Battery or charging problem",

                        "Broken screen",

                        "Keyboard or touchpad problem",

                        "Overheating",

                        "Slow performance",

                        "Wi-Fi not working",

                        "Blue screen or system crash",

                        "Hinge or body damage",

                        "Other laptop issue",

                      ]

                    : deviceType === "Tablet"

                    ? [

                        "Cracked touchscreen",

                        "Battery draining quickly",

                        "Charging port problem",

                        "Touch not responding",

                        "Camera or speaker problem",

                        "Software problem",

                        "Tablet not turning on",

                        "Wi-Fi or connectivity problem",

                        "Other tablet issue",

                      ]

                    : deviceType === "Headphones"
                    ? [

                        "No sound or distorted audio",

                        "Battery not holding charge",

                        "Bluetooth pairing problem",

                        "Microphone not working",

                        "Broken cable or connector",

                        "Damaged ear cushion or headband",

                        "Headphones not turning on",

                        "Other headphone issue",

                      ]

                    : [

                        "Power or battery problem",

                        "Broken or damaged parts",

                        "Connectivity problem",

                        "Water damage",

                        "Software problem",

                        "Device not turning on",

                        "Buttons or controls not working",

                        "Other device issue",

                      ]

                  ).map((problem) => (

                    <option key={problem} value={problem}>

                      {problem}

                    </option>

                  ))}

                </select>

              </label>

              <label className="repair-field-label">Additional details

                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="When did the issue start? Was the device dropped? What have you tried?" rows={4} />

              </label>

              <div className="repair-form-section-title"><span>03</span><div><h3>Add a photo</h3><p>Optional · A clear image can help explain visible damage.</p></div></div>

              <label className="repair-upload-zone">

                <input type="file" accept="image/*" onChange={handlePhoto} />

                {photo ? <ImagePlus size={30} /> : <Upload size={30} />}

                <strong>{photo ? photo.name : "Upload a device photo"}</strong>

                <span>{photo ? "Click to choose a different image" : "PNG, JPG or WEBP · Maximum 5 MB"}</span>

              </label>

              <div className="repair-form-section-title"><span>04</span><div><h3>Where should we look?</h3><p>Enter your area to help find suitable nearby repair shops.</p></div></div>

              <label className="repair-field-label">Your area or locality *

                <div className="repair-location-input">

                  <MapPin size={18} />

                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Jodimetla, Hyderabad" required />

                </div>

              </label>

              <div className="repair-form-actions">

                <p><ShieldCheck size={16} /> Your request is a frontend demo and won't contact real shops yet.</p>

                <button className="repair-button repair-button-primary" type="submit">Submit repair request <ArrowRight size={17} /></button>

              </div>

            </form>

          </section>

        )}

        {active === "nearby" && (
          <section className="repair-content">
            <div className="repair-page-heading">
              <span className="repair-eyebrow">LOCAL REPAIR NETWORK</span>
              <h1>Good help, <span>closer to home.</span></h1>
              <p>Find mapped mobile, computer, and electronics repair businesses near your chosen area.</p>
            </div>

            <div className="repair-search-bar">
              <MapPin size={19} />
              <input
                value={mapSearchLocation}
                onChange={(event) => setMapSearchLocation(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") searchRepairShops();
                }}
                placeholder="Enter locality or postcode, e.g. Jodimetla, Hyderabad"
              />
              <button
                className="repair-button repair-button-primary"
                onClick={searchRepairShops}
                disabled={mapLoading}
              >
                {mapLoading ? "Searching..." : "Search area"}
              </button>
              <button
                className="repair-outline-button"
                onClick={findMyLocation}
                disabled={mapLoading}
                type="button"
              >
                <Navigation size={16} /> My Location
              </button>
            </div>

            <div className="repair-map-controls">
              <label>
                Search radius
                <select
                  value={searchRadius}
                  onChange={(event) => setSearchRadius(Number(event.target.value))}
                >
                  <option value={1000}>1 km</option>
                  <option value={3000}>3 km</option>
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                </select>
              </label>
              <label>
                Device category
                <select
                  value={shopCategory}
                  onChange={(event) => setShopCategory(event.target.value)}
                >
                  <option value="all">All shops</option>
                  <option value="mobile_phone">Mobile phones</option>
                  <option value="computer">Computers</option>
                  <option value="electronics">Electronics</option>
                </select>
              </label>
              <button
                className="repair-outline-button"
                type="button"
                onClick={() => searchRepairShops()}
                disabled={mapLoading}
              >
                Refresh results
              </button>
            </div>

            {mapError && <div className="repair-notice" role="status">{mapError}</div>}

            <div className="repair-live-map">
              <MapContainer
                center={mapPosition}
                zoom={13}
                scrollWheelZoom
                style={{ height: "480px", width: "100%" }}
              >
                <MapRecenter position={mapPosition} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
                <Circle
                  center={mapPosition}
                  radius={searchRadius}
                  pathOptions={{
                    color: "#ff8a00",
                    fillColor: "#ff8a00",
                    fillOpacity: 0.07
                  }}
                />
                {filteredShops
                  .map((shop) => (
                    <Marker
                      key={shop.id}
                      position={[shop.lat, shop.lon]}
                      icon={repairShopIcon}
                    >
                      <Popup>
                        <strong>{shop.name}</strong>
                        <p>{shop.type.replaceAll("_", " ")}</p>
                        <p>{shop.distance.toFixed(2)} km away</p>
                        {shop.address && <p>{shop.address}</p>}
                        {shop.phone && <p>Phone: {shop.phone}</p>}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent("Jodimetla, Hyderabad, Telangana, India")}&destination=${encodeURIComponent(`${shop.lat},${shop.lon}`)}&travelmode=driving`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Get directions
                        </a>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>

            <div className="repair-section-heading">
              <div>
                <h2>Repair providers</h2>
                <p>Listings are drawn from available OpenStreetMap data and may be incomplete.</p>
              </div>
              <span className="repair-result-count">
                {filteredShops.length} shops
              </span>
            </div>

            {mapLoading && <p>Searching for repair shops...</p>}
            {!mapLoading && !mapError && liveShops.length === 0 && (
              <p>Enter an area and select Search area to find mapped repair shops.</p>
            )}

            <div className="repair-shop-grid">
              {filteredShops
                .map((shop) => (
                  <article className="repair-shop-card" key={shop.id}>
                    <div className="repair-shop-card-top">
                      <div className="repair-shop-avatar large"><Wrench size={25} /></div>
                      <span className="repair-open-label">Map listing</span>
                    </div>
                    <h3>{shop.name}</h3>
                    <p>{shop.type.replaceAll("_", " ")}</p>
                    <div className="repair-shop-details">
                      <span><MapPin size={15} /> {shop.distance.toFixed(2)} km</span>
                      {shop.phone && <span>{shop.phone}</span>}
                    </div>
                    {shop.address && <p>{shop.address}</p>}
                    <div className="repair-shop-card-footer">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent("Jodimetla, Hyderabad, Telangana, India")}&destination=${encodeURIComponent(`${shop.lat},${shop.lon}`)}&travelmode=driving`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Get directions ↗
                      </a>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        )}

        {active === "quotes" && (

          <section className="repair-content">

            <div className="repair-page-heading">

              <span className="repair-eyebrow">MAKE AN INFORMED CHOICE</span>

              <h1>Compare before <span>you commit.</span></h1>

              <p>Review repair price, estimated time, and warranty terms side by side.</p>

            </div>

            <div className="repair-quote-notice">

              <Lightbulb size={21} />

              <div><strong>Look beyond the lowest price</strong><p>Compare parts quality, warranty, estimated completion time, and shop reputation.</p></div>

            </div>

            <div className="repair-quote-filter">

              <label>Compare bids for
                <select value={selectedRequestId} onChange={(event) => loadBidsForRequest(event.target.value)}>
                  <option value="">Select one of your repair requests</option>
                  {requests.map((request) => <option key={request.id} value={request.id}>{request.brand} {request.deviceCategory} {request.model} · {request.issue}</option>)}
                </select>
              </label>

              <select value={quoteFilter} onChange={(e) => setQuoteFilter(e.target.value)}>

                <option>All</option>

                <option>Lowest price</option>

                <option>Fastest repair</option>

                <option>Longest warranty</option>

              </select>
              <button className="repair-outline-button" type="button" onClick={() => loadBidsForRequest(selectedRequestId)} disabled={!selectedRequestId || quotesLoading}>Refresh bids</button>

            </div>

            <div className="repair-quote-list">

              {quotesLoading && <p className="repair-data-state">Loading bids…</p>}
              {quoteError && <p className="repair-data-state" role="alert">{quoteError}</p>}
              {!quotesLoading && selectedRequestId && quotes.length === 0 && <p className="repair-data-state">No bids yet. Repair shops can respond while this request is open.</p>}
              {!quotesLoading && !selectedRequestId && <p className="repair-data-state">Choose one of your repair requests to compare its bids.</p>}
              {[...quotes]

                .sort((a, b) => {

                  if (quoteFilter === "Lowest price") return a.price - b.price;

                  if (quoteFilter === "Fastest repair") return parseInt(a.time) - parseInt(b.time);

                  if (quoteFilter === "Longest warranty") return (parseInt(b.warranty, 10) || 0) - (parseInt(a.warranty, 10) || 0);

                  return a.price - b.price;

                })

                .map((quote) => (

                  <article className={`repair-quote-card ${selectedQuote?.id === quote.id ? "chosen" : ""}`} key={quote.id}>

                    <div className="repair-quote-shop">

                      <div className="repair-shop-avatar"><Wrench size={21} /></div>

                      <div><h3>{quote.shop}</h3><p>{quote.issue}</p><span className="repair-rating">{quote.shopDetails.experienceYears} years of experience · {quote.shopDetails.address}</span></div>

                    </div>

                    <div className="repair-quote-detail"><span>Estimated price</span><strong>{money(quote.price)}</strong></div>

                    <div className="repair-quote-detail"><span>Estimated time</span><strong><Clock size={15} /> {quote.time}</strong></div>

                    <div className="repair-quote-detail"><span>Parts required</span><strong>{quote.partsRequired.length ? quote.partsRequired.join(", ") : "Not specified"}</strong></div>

                    <div className="repair-quote-detail"><span>Warranty</span><strong><ShieldCheck size={15} /> {quote.warranty || quote.shopDetails.warrantyPolicy || "Not specified"}</strong></div>

                    <a className="repair-shop-profile-link" href={`/shops/${quote.sellerId}`}>View shop profile <ArrowRight size={14} /></a>

                    <div className="repair-quote-contact">{quote.shopDetails.phone && <a href={`tel:${quote.shopDetails.phone}`}>{quote.shopDetails.phone}</a>}{quote.shopDetails.publicEmail && <a href={`mailto:${quote.shopDetails.publicEmail}`}>{quote.shopDetails.publicEmail}</a>}</div>

                    <button disabled={quote.status !== "SUBMITTED"} className={selectedQuote?.id === quote.id ? "repair-button repair-button-selected" : "repair-button repair-button-primary"} onClick={() => acceptQuote(quote)}>

                      {selectedQuote?.id === quote.id ? "Accepted" : quote.status === "SUBMITTED" ? "Accept bid" : quote.status}

                    </button>

                  </article>

                ))}

            </div>

            <p className="repair-disclaimer">Bids are submitted by registered repair shops. Accepting one assigns the repair and starts its tracked job history.</p>

          </section>

        )}

        {active === "ai" && (

          <section className="repair-content">

            <div className="repair-page-heading">

              <span className="repair-eyebrow">YOUR REPAIR ASSISTANT</span>

              <h1>Let's understand <span>the problem.</span></h1>

              <p>Describe the symptoms to get general troubleshooting ideas and prepare for a repair visit.</p>

            </div>

            <div className="repair-ai-layout">

              <div className="repair-ai-chat">

                <div className="repair-ai-header">

                  <div className="repair-ai-mark"><BrainCircuit size={24} /></div>

                  <div><h3>FixIt AI Assistant</h3><span><span className="repair-online-dot" /> General guidance · Demo</span></div>

                 <span className="repair-ai-tag">AI ASSISTANT</span>

                </div>

                <div className="repair-ai-messages">

                  {aiMessages.map((message, index) => (

                    <div key={index} className={`repair-ai-message ${message.from === "user" ? "from-user" : "from-ai"}`}>

                      {message.from === "ai" && <span className="repair-ai-mini-icon"><Wrench size={15} /></span>}

                      <p>{message.text}</p>

                    </div>

                  ))}

                </div>

                <form className="repair-ai-input" onSubmit={askAI}>

                  <input value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} placeholder="Describe your device problem..." />

                  <button type="submit" aria-label="Send message"><Send size={18} /></button>

                </form>

                <p className="repair-ai-disclaimer">Demo guidance only. This is not a confirmed diagnosis. A technician may need to inspect your device.</p>

              </div>

              <aside className="repair-ai-tips">

                <h3><Lightbulb size={19} /> Before you visit a shop</h3>

                <div><CheckCircle2 size={17} /><span>Note when the issue first appeared.</span></div>

                <div><CheckCircle2 size={17} /><span>Back up important data if possible.</span></div>

                <div><CheckCircle2 size={17} /><span>Tell the technician about drops or liquid exposure.</span></div>

                <div><CheckCircle2 size={17} /><span>Ask for a quote and warranty before approving repair.</span></div>

                <button className="repair-outline-button repair-full-button" onClick={() => changeSection("report")}>Create repair request <ArrowRight size={15} /></button>

              </aside>

            </div>

          </section>

        )}

        {active === "repairs" && (

          <section className="repair-content">

            <div className="repair-page-heading">

              <span className="repair-eyebrow">YOUR REPAIR JOURNEY</span>

              <h1>Every repair, <span>in one place.</span></h1>

              <p>Review requests and follow each accepted repair through its status history.</p>

            </div>

            <div className="repair-repair-summary">

              <div><span>All requests</span><strong>{requests.length}</strong></div>

              <div><span>In progress</span><strong>{jobs.filter((job) => ["IN_PROGRESS", "WAITING_FOR_PARTS", "READY_FOR_PICKUP"].includes(job.status)).length}</strong></div>

              <div><span>Awaiting bids</span><strong>{requests.filter((r) => r.status === "OPEN").length}</strong></div>

            </div>

            <div className="repair-panel">

              <div className="repair-panel-heading">

                <div><h3>Your repair requests</h3><p>Requests saved to your FixIt account.</p></div>

                <button className="repair-button repair-button-primary" onClick={() => changeSection("report")}><Camera size={16} /> New request</button>

              </div>

              {dataLoading ? <p className="repair-data-state">Loading your requests…</p> : requests.length === 0 ? (

                <div className="repair-empty"><ClipboardCheck size={35} /><h3>No repair requests yet</h3><p>Report a damaged device to start your repair journey.</p><button className="repair-button repair-button-primary" onClick={() => changeSection("report")}>Report a device</button></div>

              ) : (

                <div className="repair-table-wrap">

                  <table className="repair-table">

                    <thead><tr><th>REQUEST</th><th>DEVICE / ISSUE</th><th>STATUS</th><th>QUOTES</th><th>DATE</th></tr></thead>

                    <tbody>

                      {matchingRequests.map((request) => (

                        <tr key={request.id}>

                          <td><strong>{request.id}</strong></td>

                          <td><strong>{[request.brand, request.deviceCategory, request.model].filter(Boolean).join(" ")}</strong><span>{request.issue}</span></td>

                          <td><span className={`repair-status ${request.status !== "OPEN" ? "status-progress" : ""}`}>{request.status.replaceAll("_", " ")}</span></td>

                          <td><button className="repair-text-button" onClick={() => loadBidsForRequest(request.id)}>{request.bids || 0} · Compare</button></td>

                          <td>{new Date(`${request.createdAt}Z`).toLocaleDateString()}</td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

            {jobs.length > 0 && (
              <div className="repair-active-jobs">
                <div className="repair-section-heading"><div><h2>Assigned repairs</h2><p>Live status and progress history from your repair shop.</p></div></div>
                {jobs.map((job) => (
                  <article className="repair-job-card" key={job.id}>
                    <div className="repair-panel-heading">
                      <div><h3>{job.request.brand} {job.request.deviceCategory} {job.request.model}</h3><p>{job.request.issue} · {job.request.location}</p></div>
                      <span className="repair-status status-progress">{job.status.replaceAll("_", " ")}</span>
                    </div>
                    <div className="repair-job-shop"><strong>{job.shop.shopName}</strong><span>{job.shop.address}</span><a href={`/shops/${job.sellerId}`}>Shop profile</a>{job.shop.phone && <a href={`tel:${job.shop.phone}`}>{job.shop.phone}</a>}{job.shop.publicEmail && <a href={`mailto:${job.shop.publicEmail}`}>{job.shop.publicEmail}</a>}</div>
                    <ol className="repair-job-history">{job.history.map((entry) => <li key={`${entry.createdAt}-${entry.toStatus}`}><strong>{entry.toStatus.replaceAll("_", " ")}</strong><time>{new Date(`${entry.createdAt}Z`).toLocaleString()}</time>{entry.note && <p>{entry.note}</p>}</li>)}</ol>
                  </article>
                ))}
              </div>
            )}
            <div className="repair-privacy-note"><ShieldCheck size={18} /><p>Requests and repair updates are stored with your FixIt account. Private account credentials are not shown on public shop profiles.</p></div>

          </section>

        )}

        <footer className="repair-footer">

          <span>FixIt © 2026</span>

          <span>Repair smarter. Waste less.</span>

          <span>Frontend preview · Sample data</span>

        </footer>

      </main>

    </div>

  );

}
