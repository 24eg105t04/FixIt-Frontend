
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wrench, LayoutDashboard, ClipboardList, Package, IndianRupee,
  LogOut, Search, Clock, CheckCircle2, Send, Plus, Store
} from "lucide-react";
import { useAuth } from "../AuthContext";
import "../styles/dashboard.css";

const initialJobs = [
  { id: "FX-2041", device: "iPhone 14", issue: "Cracked screen", budget: "₹1,500–₹2,500", location: "Hyderabad", status: "New request" },
  { id: "FX-2039", device: "HP Pavilion", issue: "Overheating", budget: "₹800–₹1,500", location: "Hyderabad", status: "New request" },
  { id: "FX-2035", device: "Samsung Galaxy", issue: "Charging port issue", budget: "₹500–₹1,200", location: "Secunderabad", status: "In repair" },
];

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [jobs, setJobs] = useState(initialJobs);
  const [search, setSearch] = useState("");
  const [bidJob, setBidJob] = useState(null);
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("4");
  const [notice, setNotice] = useState("");

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function submitBid(event) {
    event.preventDefault();
    if (!price || Number(price) <= 0) return;

    setJobs((previous) => previous.map((job) =>
      job.id === bidJob.id
        ? { ...job, status: `Quote submitted: ₹${Number(price).toLocaleString("en-IN")}` }
        : job
    ));

    setNotice(`Your demo quote for ${bidJob.id} has been submitted locally.`);
    setBidJob(null);
    setPrice("");
  }

  const visibleJobs = jobs.filter((job) =>
    `${job.id} ${job.device} ${job.issue} ${job.location} ${job.status}`
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-shell seller-theme">
      <aside className="dashboard-sidebar">
        <Link to="/" className="brand dashboard-brand"><span className="brand-mark"><Wrench size={20} /></span> FixIt.</Link>
        <div className="sidebar-caption">SELLER WORKSPACE</div>
        <nav className="sidebar-nav">
          {[
            { label: "Overview", icon: LayoutDashboard },
            { label: "Repair requests", icon: ClipboardList },
            { label: "Inventory", icon: Package },
            { label: "Earnings", icon: IndianRupee },
          ].map(({ label, icon: Icon }) => (
            <button key={label} className={`sidebar-link ${activeTab === label ? "active" : ""}`} onClick={() => setActiveTab(label)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-mini">
            <div className="profile-avatar">{(user?.name || "S").charAt(0).toUpperCase()}</div>
            <div><strong>{user?.name || "Shop seller"}</strong><small>Seller account</small></div>
          </div>
          <button className="sidebar-link" onClick={handleLogout}><LogOut size={17} /> Log out</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><div className="dashboard-breadcrumb">FixIt / Seller workspace</div><h1>{activeTab}</h1></div>
          <span className="dashboard-status status-progress"><Store size={13} style={{ display: "inline" }} /> Seller workspace</span>
        </header>

        {notice && <div className="alert alert-success" style={{ marginBottom: 20 }}><CheckCircle2 size={18} /> {notice}</div>}

        {activeTab === "Overview" && (
          <>
            <section className="dashboard-welcome seller-welcome">
              <div><span className="eyebrow">YOUR SHOP, YOUR WORKFLOW</span><h2>Welcome, {user?.name || "seller"}!</h2><p>Review new repair requests and prepare quotes for potential customers.</p><button className="btn btn-primary" onClick={() => setActiveTab("Repair requests")}><ClipboardList size={17} /> View repair requests</button></div>
              <div className="welcome-art"><Store size={72} strokeWidth={1.1} /></div>
            </section>

            <section className="dashboard-stats">
              <article className="dashboard-stat"><span>Open requests</span><strong>{jobs.filter((j) => j.status === "New request").length}</strong><small>Ready for your quote</small></article>
              <article className="dashboard-stat"><span>Quotes submitted</span><strong>{jobs.filter((j) => j.status.startsWith("Quote submitted")).length}</strong><small>Demo quotes</small></article>
              <article className="dashboard-stat"><span>Repairs in progress</span><strong>{jobs.filter((j) => j.status === "In repair").length}</strong><small>Current workload</small></article>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-heading"><div><h2>Latest repair requests</h2><p>Review the sample jobs available to your shop.</p></div><button className="btn btn-secondary btn-small" onClick={() => setActiveTab("Repair requests")}>View all</button></div>
              <JobList jobs={visibleJobs.slice(0, 3)} onBid={setBidJob} />
            </section>
          </>
        )}

        {activeTab === "Repair requests" && (
          <section className="dashboard-section">
            <div className="dashboard-section-heading"><div><h2>Repair requests</h2><p>Search requests and submit an illustrative quote.</p></div></div>
            <div className="dashboard-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search device, problem or request..." /></div>
            <JobList jobs={visibleJobs} onBid={setBidJob} />
          </section>
        )}

        {activeTab === "Inventory" && (
          <section className="dashboard-section">
            <div className="dashboard-section-heading"><div><h2>Inventory</h2><p>Sample products for your shop.</p></div><button className="btn btn-primary btn-small" onClick={() => setNotice("Product listing will be connected to the backend later.")}><Plus size={15} /> Add product</button></div>
            <div className="dashboard-feature-grid">
              <article className="dashboard-feature"><Package size={26} /><h3>USB-C charger</h3><p>Sample stock: 12 units</p><strong>₹899</strong></article>
              <article className="dashboard-feature"><Package size={26} /><h3>Phone screen guard</h3><p>Sample stock: 25 units</p><strong>₹249</strong></article>
              <article className="dashboard-feature"><Package size={26} /><h3>Laptop adapter</h3><p>Sample stock: 8 units</p><strong>₹1,499</strong></article>
            </div>
          </section>
        )}

        {activeTab === "Earnings" && (
          <section className="dashboard-section">
            <div className="dashboard-section-heading"><div><h2>Earnings overview</h2><p>Illustrative values for the interface preview.</p></div></div>
            <div className="dashboard-stats">
              <article className="dashboard-stat"><span>Sample monthly revenue</span><strong>₹24,500</strong><small>Demo value, not real earnings</small></article>
              <article className="dashboard-stat"><span>Completed jobs</span><strong>18</strong><small>Example metric</small></article>
              <article className="dashboard-stat"><span>Shop rating</span><strong>4.8 ★</strong><small>Illustrative rating</small></article>
            </div>
          </section>
        )}
      </main>

      {bidJob && (
        <div className="modal-backdrop" onClick={() => setBidJob(null)}>
          <section className="bid-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setBidJob(null)} aria-label="Close">×</button>
            <span className="eyebrow">SUBMIT A QUOTE</span>
            <h2>{bidJob.id} · {bidJob.device}</h2>
            <p className="text-muted">{bidJob.issue} · Customer budget: {bidJob.budget}</p>
            <form onSubmit={submitBid}>
              <div className="form-group"><label htmlFor="quote-price">Your price (₹)</label><input id="quote-price" className="form-control" type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Enter your quote" required /></div>
              <div className="form-group"><label htmlFor="quote-hours">Estimated completion</label><select id="quote-hours" className="form-control" value={hours} onChange={(event) => setHours(event.target.value)}><option value="2">2 hours</option><option value="4">4 hours</option><option value="8">8 hours</option><option value="24">24 hours</option><option value="48">2 days</option></select></div>
              <button className="btn btn-primary btn-block" type="submit"><Send size={16} /> Submit demo quote</button>
            </form>
            <p className="auth-demo-note">This quote is stored in frontend state only. No customer or server receives it yet.</p>
          </section>
        </div>
      )}
    </div>
  );
}

function JobList({ jobs, onBid }) {
  if (!jobs.length) return <div className="empty-state"><h3>No requests found</h3><p>Try another search term.</p></div>;

  return (
    <div className="job-list">
      {jobs.map((job) => (
        <article className="job-card" key={job.id}>
          <div className="job-icon"><Wrench size={21} /></div>
          <div className="job-info"><div className="job-title">{job.device} · {job.id}</div><p>{job.issue}</p><div className="job-meta"><span><Clock size={13} /> {job.location}</span><span>Budget: {job.budget}</span></div></div>
          <div className="job-action"><span className="dashboard-status status-pending">{job.status}</span>{job.status === "New request" && <button className="btn btn-primary btn-small" onClick={() => onBid(job)}>Submit quote</button>}</div>
        </article>
      ))}
    </div>
  );
}
