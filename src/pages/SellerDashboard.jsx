import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, BriefcaseBusiness, CheckCircle2, Clock,
  ExternalLink, FileText, ImagePlus, LogOut, MapPin, Package, Phone,
  Save, Search, Send, Store, Wrench,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { apiRequest } from "../lib/api";
import FixItThemeSwitcher from "../components/ui/FixItThemeSwitcher";
import "../styles/dashboard.css";

const emptyProfile = (ownerName = "") => ({
  shopName: "", ownerName, logoUrl: "", coverImageUrl: "", description: "",
  experienceYears: 0, phone: "", publicEmail: "", address: "", latitude: "", longitude: "",
  openingHours: { hoursText: "" }, categories: [], services: [], pricingInfo: "", warrantyPolicy: "",
});

const transitions = {
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_PARTS", "READY_FOR_PICKUP", "CANCELLED"],
  WAITING_FOR_PARTS: ["IN_PROGRESS", "READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
};

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
}

function imageUrl(value) {
  if (!value || value.startsWith("data:") || /^https?:/.test(value)) return value;
  return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}${value}`;
}

function hoursLabel(hours) {
  if (hours < 24) return `${hours} hours`;
  const days = hours / 24;
  return `${Number.isInteger(days) ? days : days.toFixed(1)} days`;
}

function listText(value) {
  return Array.isArray(value) ? value.join(", ") : value || "";
}

function listPreview(value) {
  return listText(value).split(",").map((entry) => entry.trim()).filter(Boolean).join(" · ");
}

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [requests, setRequests] = useState([]);
  const [bids, setBids] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(emptyProfile(user?.name));
  const [search, setSearch] = useState("");
  const [bidRequest, setBidRequest] = useState(null);
  const [editingBid, setEditingBid] = useState(null);
  const [bidForm, setBidForm] = useState({ price: "", estimatedHours: "4", partsRequired: "", warranty: "", notes: "" });
  const [jobNotes, setJobNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refreshWorkspace() {
    const [requestData, bidData, jobData, profileData] = await Promise.all([
      apiRequest("/api/marketplace/requests/open"),
      apiRequest("/api/marketplace/bids/mine"),
      apiRequest("/api/marketplace/jobs/mine"),
      apiRequest("/api/marketplace/shops/me"),
    ]);
    setRequests(requestData.requests || []);
    setBids(bidData.bids || []);
    setJobs(jobData.jobs || []);
    setProfile(profileData.profile || emptyProfile(user?.name));
  }

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiRequest("/api/marketplace/requests/open"),
      apiRequest("/api/marketplace/bids/mine"),
      apiRequest("/api/marketplace/jobs/mine"),
      apiRequest("/api/marketplace/shops/me"),
    ]).then(([requestData, bidData, jobData, profileData]) => {
      if (!mounted) return;
      setRequests(requestData.requests || []);
      setBids(bidData.bids || []);
      setJobs(jobData.jobs || []);
      setProfile(profileData.profile || emptyProfile(user?.name));
    }).catch((requestError) => {
      if (mounted) setError(requestError.message || "Unable to load the shop workspace.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [user?.name]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function submitBid(event) {
    event.preventDefault();
    if (!bidRequest) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest(editingBid
        ? `/api/marketplace/bids/${encodeURIComponent(editingBid.id)}`
        : `/api/marketplace/requests/${encodeURIComponent(bidRequest.id)}/bids`, {
        method: editingBid ? "PUT" : "POST",
        body: {
          price: Number(bidForm.price),
          estimatedHours: Number(bidForm.estimatedHours),
          partsRequired: bidForm.partsRequired.split(",").map((part) => part.trim()).filter(Boolean),
          warranty: bidForm.warranty,
          notes: bidForm.notes,
        },
      });
      setNotice(editingBid ? "Your bid was updated for the customer." : "Your bid was submitted to the customer.");
      setBidRequest(null);
      setEditingBid(null);
      setBidForm({ price: "", estimatedHours: "4", partsRequired: "", warranty: "", notes: "" });
      await refreshWorkspace();
    } catch (requestError) {
      setError(requestError.message || "Unable to submit your bid.");
    } finally {
      setSaving(false);
    }
  }

  function openBidEditor(request, bid = null) {
    setBidRequest(request);
    setEditingBid(bid);
    setBidForm(bid ? {
      price: String(bid.price),
      estimatedHours: String(bid.estimatedHours),
      partsRequired: bid.partsRequired.join(", "),
      warranty: bid.warranty,
      notes: bid.notes,
    } : { price: "", estimatedHours: "4", partsRequired: "", warranty: "", notes: "" });
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...profile,
        experienceYears: Number(profile.experienceYears || 0),
        latitude: profile.latitude === "" ? null : Number(profile.latitude),
        longitude: profile.longitude === "" ? null : Number(profile.longitude),
        openingHours: typeof profile.openingHours === "object" ? profile.openingHours : { hoursText: profile.openingHours },
        categories: Array.isArray(profile.categories) ? profile.categories : profile.categories.split(",").map((value) => value.trim()).filter(Boolean),
        services: Array.isArray(profile.services) ? profile.services : profile.services.split(",").map((value) => value.trim()).filter(Boolean),
      };
      const result = await apiRequest("/api/marketplace/shops/me", { method: "PUT", body: payload });
      setProfile(result.profile);
      setNotice("Your public shop profile is saved.");
    } catch (requestError) {
      setError(requestError.message || "Unable to save your shop profile.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(field, file) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const dataUrl = await readImage(file);
      const result = await apiRequest("/api/marketplace/shops/me/images", { method: "POST", body: { field, dataUrl } });
      setProfile((current) => ({ ...current, [field]: result.imageUrl }));
      setNotice("Shop image uploaded.");
    } catch (requestError) {
      setError(requestError.message || "Unable to upload this image.");
    } finally {
      setSaving(false);
    }
  }

  async function updateJob(job, status) {
    try {
      setError("");
      const result = await apiRequest(`/api/marketplace/jobs/${encodeURIComponent(job.id)}/status`, {
        method: "PATCH",
        body: { status, note: jobNotes[job.id] || "" },
      });
      setNotice(`Repair status updated to ${result.job.status.replaceAll("_", " ")}.`);
      setJobNotes((current) => ({ ...current, [job.id]: "" }));
      await refreshWorkspace();
    } catch (requestError) {
      setError(requestError.message || "Unable to update this repair.");
    }
  }

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  const visibleRequests = requests.filter((request) =>
    `${request.id} ${request.deviceCategory} ${request.brand} ${request.model} ${request.issue} ${request.location}`.toLowerCase().includes(search.toLowerCase())
  );
  const openJobs = jobs.filter((job) => !["COMPLETED", "CANCELLED"].includes(job.status));
  const tabs = ["Overview", "Open requests", "My bids", "Active repairs", "Shop profile"];
  const openCount = requests.length;
  const activeCount = openJobs.length;
  const submittedCount = bids.filter((bid) => bid.status === "SUBMITTED").length;

  return (
    <div className="dashboard-shell seller-theme seller-marketplace">
      <aside className="dashboard-sidebar">
        <Link to="/seller-dashboard" className="brand dashboard-brand"><span className="brand-mark"><Wrench size={20} /></span> FixIt.</Link>
        <div className="sidebar-caption">REPAIR SHOP WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Seller workspace">
          {tabs.map((tab) => <button key={tab} className={`sidebar-link ${activeTab === tab ? "active" : ""}`} onClick={() => { setActiveTab(tab); setNotice(""); }}><Store size={17} />{tab}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-mini"><div className="profile-avatar">{(user?.name || "S").charAt(0).toUpperCase()}</div><div><strong>{user?.name || "Shop owner"}</strong><small>Repair shop owner</small></div></div>
          <button className="sidebar-link" onClick={handleLogout}><LogOut size={17} /> Log out</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><div className="dashboard-breadcrumb">FixIt / Repair shop</div><h1>{activeTab}</h1></div>
          <div className="seller-header-actions"><FixItThemeSwitcher /><span className="dashboard-status status-progress"><Store size={14} /> Seller account</span></div>
        </header>
        {error && <div className="seller-feedback seller-feedback-error" role="alert">{error}</div>}
        {notice && <div className="seller-feedback" role="status"><CheckCircle2 size={17} /> {notice}</div>}
        {loading ? <div className="seller-empty-state">Loading your shop workspace…</div> : (
          <>
            {activeTab === "Overview" && <>
              <section className="dashboard-welcome seller-welcome">
                <div><span className="eyebrow">YOUR SHOP, YOUR WORKFLOW</span><h2>{profile.shopName || `Welcome, ${user?.name || "shop owner"}`}</h2><p>Review open repair requests, submit clear bids, and manage every accepted repair in one place.</p><button className="btn btn-primary" onClick={() => setActiveTab("Open requests")}><BriefcaseBusiness size={17} /> Browse open requests</button></div>
                <div className="welcome-art"><Store size={65} strokeWidth={1.1} /></div>
              </section>
              <section className="dashboard-stats">
                <article className="dashboard-stat"><span>Open requests</span><strong>{openCount}</strong><small>Available for bids now</small></article>
                <article className="dashboard-stat"><span>My bids</span><strong>{bids.length}</strong><small>{submittedCount} awaiting outcome</small></article>
                <article className="dashboard-stat"><span>Active repairs</span><strong>{activeCount}</strong><small>Assigned to your shop</small></article>
              </section>
              <section className="dashboard-section">
                <div className="dashboard-section-heading"><div><h2>Latest open requests</h2><p>Customer-posted work available to your shop.</p></div><button className="btn btn-secondary btn-small" onClick={() => setActiveTab("Open requests")}>See all</button></div>
                <RequestList requests={visibleRequests.slice(0, 3)} bids={bids} onBid={openBidEditor} hasProfile={Boolean(profile.shopName)} />
              </section>
              {profile.shopName === "" && <section className="seller-profile-prompt"><Store size={20} /><div><strong>Publish your shop profile to place bids.</strong><span>Add your services and contact details so customers can review your business.</span></div><button className="btn btn-primary btn-small" onClick={() => setActiveTab("Shop profile")}>Set up profile <ArrowRight size={15} /></button></section>}
            </>}

            {activeTab === "Open requests" && <section className="dashboard-section">
              <div className="dashboard-section-heading"><div><h2>Open repair requests</h2><p>Review the repair details before sending a bid.</p></div></div>
              <div className="dashboard-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search device, issue, or location" /></div>
              <RequestList requests={visibleRequests} bids={bids} onBid={openBidEditor} hasProfile={Boolean(profile.shopName)} />
            </section>}

            {activeTab === "My bids" && <section className="dashboard-section">
              <div className="dashboard-section-heading"><div><h2>My bids</h2><p>Track customer decisions and accepted work.</p></div></div>
              {!bids.length ? <div className="seller-empty-state">You have not submitted a bid yet.</div> : <div className="seller-record-list">{bids.map((bid) => <article className="seller-record" key={bid.id}><div className="job-icon"><FileText size={20} /></div><div className="job-info"><strong>{bid.brand} {bid.deviceCategory} {bid.model} · Request {bid.requestId.slice(0, 8)}</strong><p>{bid.issue}</p><div className="job-meta"><span><MapPin size={13} /> {bid.location}</span><span>{hoursLabel(bid.estimatedHours)}</span><span>{bid.warranty || "No warranty stated"}</span></div></div><div className={`seller-bid-status status-${bid.status.toLowerCase()}`}>{bid.status.replaceAll("_", " ")}</div><strong className="seller-bid-price">₹{bid.price.toLocaleString("en-IN")}</strong></article>)}</div>}
            </section>}

            {activeTab === "Active repairs" && <section className="dashboard-section">
              <div className="dashboard-section-heading"><div><h2>Active repairs</h2><p>Update only jobs assigned to your authenticated shop.</p></div></div>
              {!openJobs.length ? <div className="seller-empty-state">No accepted repairs are currently active.</div> : <div className="seller-job-list">{openJobs.map((job) => <article className="seller-job-card" key={job.id}>
                <div className="dashboard-section-heading"><div><span className="eyebrow">{job.status.replaceAll("_", " ")}</span><h3>{job.request.brand} {job.request.deviceCategory} {job.request.model}</h3><p>{job.request.issue} · {job.request.location}</p></div><strong>₹{job.bid.price.toLocaleString("en-IN")}</strong></div>
                <div className="seller-job-details"><span><Clock size={15} /> {hoursLabel(job.bid.estimatedHours)}</span><span><Package size={15} /> {job.bid.partsRequired.join(", ") || "Parts not specified"}</span><span><BadgeCheck size={15} /> {job.bid.warranty || "Warranty not specified"}</span></div>
                <div className="seller-job-history">{job.history.map((entry) => <div key={`${entry.createdAt}-${entry.toStatus}`}><strong>{entry.toStatus.replaceAll("_", " ")}</strong><time>{new Date(`${entry.createdAt}Z`).toLocaleString()}</time>{entry.note && <p>{entry.note}</p>}</div>)}</div>
                <label className="seller-job-note">Progress note<input value={jobNotes[job.id] || ""} onChange={(event) => setJobNotes((current) => ({ ...current, [job.id]: event.target.value }))} placeholder="Add an update for the customer" maxLength={1000} /></label>
                <div className="seller-status-actions">{(transitions[job.status] || []).map((status) => <button className={status === "CANCELLED" ? "btn btn-secondary btn-small" : "btn btn-primary btn-small"} key={status} onClick={() => updateJob(job, status)}>{status.replaceAll("_", " ")}</button>)}</div>
              </article>)}</div>}
            </section>}

            {activeTab === "Shop profile" && <section className="seller-profile-layout">
              <form className="seller-profile-form" onSubmit={saveProfile}>
                <div className="dashboard-section-heading seller-form-title"><div><h2>Public shop profile</h2><p>Customers see these details when comparing bids.</p></div></div>
                <section className="seller-profile-section">
                  <div className="seller-profile-section-heading"><Store size={17} /><div><h3>Shop details</h3><p>Introduce your business and experience.</p></div></div>
                  <div className="seller-profile-fields">
                    <label>Shop name<input value={profile.shopName} onChange={(event) => updateProfile("shopName", event.target.value)} maxLength={120} required /></label>
                    <label>Owner name<input value={profile.ownerName} onChange={(event) => updateProfile("ownerName", event.target.value)} maxLength={100} required /></label>
                    <label className="seller-field-wide">Description<textarea value={profile.description} onChange={(event) => updateProfile("description", event.target.value)} rows={4} maxLength={2000} /></label>
                    <label>Years of experience<input type="number" min="0" max="80" value={profile.experienceYears} onChange={(event) => updateProfile("experienceYears", event.target.value)} /></label>
                  </div>
                </section>
                <section className="seller-profile-section">
                  <div className="seller-profile-section-heading"><ImagePlus size={17} /><div><h3>Branding</h3><p>Choose images that help customers recognize your shop.</p></div></div>
                  <div className="seller-image-pair">
                    <label className="seller-cover-upload" style={profile.coverImageUrl ? { backgroundImage: `linear-gradient(rgba(16,18,20,.12),rgba(16,18,20,.66)), url("${imageUrl(profile.coverImageUrl)}")` } : undefined}><ImagePlus size={20} /><strong>{profile.coverImageUrl ? "Change cover image" : "Upload cover image"}</strong><small>JPG, PNG or WEBP · up to 5 MB</small><input type="file" accept="image/png,image/jpeg,image/webp" disabled={saving} onChange={(event) => uploadImage("coverImageUrl", event.target.files?.[0])} /></label>
                    <label className="seller-logo-upload">{profile.logoUrl ? <img src={imageUrl(profile.logoUrl)} alt="Shop logo preview" /> : <Store size={25} />}<strong>{profile.logoUrl ? "Change shop logo" : "Upload shop logo"}</strong><small>JPG, PNG or WEBP · up to 5 MB</small><input type="file" accept="image/png,image/jpeg,image/webp" disabled={saving} onChange={(event) => uploadImage("logoUrl", event.target.files?.[0])} /></label>
                  </div>
                </section>
                <section className="seller-profile-section">
                  <div className="seller-profile-section-heading"><Phone size={17} /><div><h3>Contact information</h3><p>Only these public contact details appear to customers.</p></div></div>
                  <div className="seller-profile-fields">
                    <label>Phone number<input type="tel" value={profile.phone} onChange={(event) => updateProfile("phone", event.target.value)} maxLength={32} /></label>
                    <label>Public email<input type="email" value={profile.publicEmail} onChange={(event) => updateProfile("publicEmail", event.target.value)} /></label>
                    <label className="seller-field-wide">Full address<input value={profile.address} onChange={(event) => updateProfile("address", event.target.value)} maxLength={500} required /></label>
                  </div>
                </section>
                <section className="seller-profile-section">
                  <div className="seller-profile-section-heading"><MapPin size={17} /><div><h3>Shop location</h3><p>Coordinates let customers open directions and view your location on the map.</p></div></div>
                  <div className="seller-profile-fields">
                    <label>Latitude<input type="number" min="-90" max="90" step="any" value={profile.latitude ?? ""} onChange={(event) => updateProfile("latitude", event.target.value)} /></label>
                    <label>Longitude<input type="number" min="-180" max="180" step="any" value={profile.longitude ?? ""} onChange={(event) => updateProfile("longitude", event.target.value)} /></label>
                  </div>
                </section>
                <section className="seller-profile-section">
                  <div className="seller-profile-section-heading"><Wrench size={17} /><div><h3>Devices and services</h3><p>Describe the devices and repairs your team supports.</p></div></div>
                  <div className="seller-profile-fields">
                    <label className="seller-field-wide">Device categories<small>Separate entries with commas</small><input value={listText(profile.categories)} onChange={(event) => updateProfile("categories", event.target.value)} placeholder="Phones, Laptops, Tablets" /></label>
                    <label className="seller-field-wide">Repair services<small>Separate entries with commas</small><textarea value={listText(profile.services)} onChange={(event) => updateProfile("services", event.target.value)} rows={3} placeholder="Screen replacement, battery service" /></label>
                  </div>
                </section>
                <section className="seller-profile-section">
                  <div className="seller-profile-section-heading"><BadgeCheck size={17} /><div><h3>Hours, pricing and warranty</h3><p>Set expectations before a customer contacts your shop.</p></div></div>
                  <div className="seller-profile-fields">
                    <label className="seller-field-wide">Opening hours<input value={profile.openingHours?.hoursText || ""} onChange={(event) => updateProfile("openingHours", { hoursText: event.target.value })} placeholder="Mon–Sat, 9:00–18:00" maxLength={300} /></label>
                    <label className="seller-field-wide">Pricing information<textarea value={profile.pricingInfo} onChange={(event) => updateProfile("pricingInfo", event.target.value)} rows={3} maxLength={1200} placeholder="Optional starting prices or diagnostic fees" /></label>
                    <label className="seller-field-wide">Warranty policy<textarea value={profile.warrantyPolicy} onChange={(event) => updateProfile("warrantyPolicy", event.target.value)} rows={3} maxLength={1200} placeholder="Describe parts and service coverage" /></label>
                  </div>
                </section>
                <div className="seller-profile-save-row"><button className="btn btn-primary" type="submit" disabled={saving}><Save size={16} /> {saving ? "Saving profile…" : "Save Profile"}</button></div>
              </form>
              <aside className="seller-profile-preview"><span className="eyebrow">CUSTOMER PREVIEW</span><div className="seller-preview-cover" style={profile.coverImageUrl ? { backgroundImage: `url("${imageUrl(profile.coverImageUrl)}")` } : undefined} />{profile.logoUrl && <img className="seller-preview-logo" src={imageUrl(profile.logoUrl)} alt="Shop logo" />}<h3>{profile.shopName || "Your shop name"}</h3><p>{profile.description || "Your shop description will appear here."}</p><div><MapPin size={15} />{profile.address || "Shop address"}</div><div><Clock size={15} />{profile.openingHours?.hoursText || "Opening hours"}</div><div>{listPreview(profile.categories) || "Device categories"}</div><div>{listPreview(profile.services) || "Repair services"}</div>{profile.phone && <a href={`tel:${profile.phone}`}><Phone size={14} />{profile.phone}</a>}{profile.publicEmail && <a href={`mailto:${profile.publicEmail}`}>{profile.publicEmail}</a>}{profile.shopName && <Link className="btn btn-secondary btn-small" to={`/shops/${user.id}`}><ExternalLink size={14} /> Open public profile</Link>}</aside>
            </section>}
          </>
        )}
      </main>

      {bidRequest && <div className="modal-backdrop" onClick={() => setBidRequest(null)}><section className="bid-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={() => setBidRequest(null)} aria-label="Close">×</button>
        <span className="eyebrow">{editingBid ? "EDIT YOUR BID" : "SUBMIT A REPAIR BID"}</span><h2>{bidRequest.brand} {bidRequest.deviceCategory} {bidRequest.model}</h2><p>{bidRequest.issue} · {bidRequest.location}</p>
        {!profile.shopName && <p>Save your shop profile before bidding.</p>}
        <form onSubmit={submitBid}>
          <label>Repair price (₹)<input type="number" min="1" max="10000000" step="0.01" required value={bidForm.price} onChange={(event) => setBidForm((current) => ({ ...current, price: event.target.value }))} /></label>
          <label>Estimated completion (hours)<input type="number" min="0.25" max="8760" step="0.25" required value={bidForm.estimatedHours} onChange={(event) => setBidForm((current) => ({ ...current, estimatedHours: event.target.value }))} /></label>
          <label>Parts required<input value={bidForm.partsRequired} onChange={(event) => setBidForm((current) => ({ ...current, partsRequired: event.target.value }))} placeholder="Screen assembly, adhesive" /></label>
          <label>Warranty offered<input value={bidForm.warranty} onChange={(event) => setBidForm((current) => ({ ...current, warranty: event.target.value }))} placeholder="e.g. 90 days" /></label>
          <label>Repair notes<textarea value={bidForm.notes} onChange={(event) => setBidForm((current) => ({ ...current, notes: event.target.value }))} rows={3} /></label>
          <button className="btn btn-primary btn-block" type="submit" disabled={saving || !profile.shopName}><Send size={16} />{saving ? "Saving…" : editingBid ? "Save bid changes" : "Submit bid"}</button>
        </form>
      </section></div>}
    </div>
  );
}

function RequestList({ requests, bids, onBid, hasProfile }) {
  if (!requests.length) return <div className="seller-empty-state">No open requests match this view yet.</div>;
  return <div className="job-list">{requests.map((request) => {
    const existingBid = bids.find((bid) => bid.requestId === request.id && bid.status === "SUBMITTED");
    return <article className="job-card" key={request.id}>
    <div className="job-icon"><Wrench size={21} /></div>
    <div className="job-info"><div className="job-title">{request.brand} {request.deviceCategory} {request.model}</div><p>{request.issue}</p><p>{request.description}</p><div className="job-meta"><span><MapPin size={13} />{request.location}</span><span>{request.bids} existing bids</span><span>{new Date(`${request.createdAt}Z`).toLocaleDateString()}</span></div>{request.photos?.map((photo) => <a className="seller-request-photo" href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}${photo}`} key={photo} target="_blank" rel="noreferrer">View damage photo</a>)}</div>
    <div className="job-action"><span className="dashboard-status status-pending">OPEN</span>{existingBid && <span className="seller-bid-status status-submitted">Bid Submitted</span>}<button className="btn btn-primary btn-small" disabled={!hasProfile} onClick={() => onBid(request, existingBid)}>{!hasProfile ? "Profile required" : existingBid ? "Edit Bid" : "Submit Bid"}</button></div>
  </article>;
  })}</div>;
}
