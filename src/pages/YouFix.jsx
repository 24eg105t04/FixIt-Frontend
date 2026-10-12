
import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/youfix.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const DEVICE_TYPES = [
  { id: "phone", label: "Phone", emoji: "📱" },
  { id: "laptop", label: "Laptop", emoji: "💻" },
  { id: "headphones", label: "Headphones / Audio", emoji: "🎧" },
  { id: "controller", label: "Game controller", emoji: "🎮" },
  { id: "other", label: "Other gadget", emoji: "🔌" },
];

const DEVICE_FAMILIES = {
  phone: [
    { id: "iphone", label: "Apple iPhone" },
    { id: "android", label: "Android" },
  ],
  laptop: [
    { id: "windows", label: "Windows Laptop" },
    { id: "macbook", label: "MacBook" },
    { id: "chromebook", label: "Chromebook" },
  ],
};

const DEVICE_MODELS = {
  windows: [
    { name: "Dell Inspiron", manufacturer: "Dell" },
    { name: "Dell XPS", manufacturer: "Dell" },
    { name: "HP Pavilion", manufacturer: "HP" },
    { name: "HP Envy", manufacturer: "HP" },
    { name: "Lenovo IdeaPad", manufacturer: "Lenovo" },
    { name: "Lenovo ThinkPad", manufacturer: "Lenovo" },
    { name: "ASUS VivoBook", manufacturer: "ASUS" },
    { name: "ASUS ZenBook", manufacturer: "ASUS" },
    { name: "Acer Aspire", manufacturer: "Acer" },
    { name: "Other Windows laptop", manufacturer: "Other" },
  ],
  macbook: [
    { name: "MacBook Air", manufacturer: "Apple" },
    { name: "MacBook Pro", manufacturer: "Apple" },
  ],
  chromebook: [
    { name: "Acer Chromebook", manufacturer: "Acer" },
    { name: "HP Chromebook", manufacturer: "HP" },
    { name: "Lenovo Chromebook", manufacturer: "Lenovo" },
    { name: "Other Chromebook", manufacturer: "Other" },
  ],
};

const FALLBACK_GUIDES = [
  {
    id: "phone-charge-check",
    deviceType: "phone",
    deviceLabel: "Phone",
    title: "Phone will not charge: safe first checks",
    issue: "Charging problem",
    difficulty: "Beginner",
    duration: "10–15 min",
    tools: ["Flashlight", "Dry soft brush"],
    safety: [
      "Do not insert metal objects into the charging port.",
      "Stop if the phone or battery is swollen, hot, leaking, or smells unusual.",
    ],
    sourceTitle: "Apple Support — Charging help",
    sourceUrl: "https://support.apple.com/en-us/108805",
    steps: [
      {
        title: "Check the power source",
        body: "Try a working wall outlet and a compatible charging adapter. Test the outlet with another device.",
        image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80",
        alt: "Electronic accessories on a work surface",
      },
      {
        title: "Inspect the cable and adapter",
        body: "Look for fraying, bent connectors, scorch marks, or looseness. Stop using damaged accessories.",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
        alt: "Smartphone close-up",
      },
      {
        title: "Inspect the charging port safely",
        body: "Use a flashlight to check for visible debris. Do not insert pins, metal objects, or liquids. Seek professional help if the port is damaged.",
        image: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=1200&q=80",
        alt: "Phone being used",
      },
      {
        title: "Restart and test again",
        body: "Restart the phone and try a known-working compatible charger. If charging still fails, the port, battery, or charging circuit may need professional diagnosis.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        alt: "Technology workspace",
      },
    ],
  },
  {
    id: "phone-battery-check",
    deviceType: "phone",
    deviceLabel: "Phone",
    title: "Phone battery drains quickly",
    issue: "Battery / power",
    difficulty: "Beginner",
    duration: "10 min",
    tools: ["Device settings"],
    safety: [
      "Do not open sealed batteries.",
      "Stop using the device if the battery swells or becomes unusually hot.",
    ],
    sourceTitle: "Apple Support",
    sourceUrl: "https://support.apple.com/batteries",
    steps: [
      {
        title: "Check battery usage",
        body: "Open battery settings and identify apps using an unusually large amount of power.",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
        alt: "Smartphone",
      },
      {
        title: "Review background activity",
        body: "Close apps you do not need and review background activity settings where available.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        alt: "Technology workspace",
      },
      {
        title: "Check signal and brightness",
        body: "Very weak mobile signal and high screen brightness can increase battery usage. Test with moderate brightness.",
        image: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=1200&q=80",
        alt: "Phone in use",
      },
    ],
  },
  {
    id: "laptop-overheat-check",
    deviceType: "laptop",
    deviceLabel: "Laptop",
    title: "Laptop overheating: airflow checks",
    issue: "Overheating / fan noise",
    difficulty: "Beginner",
    duration: "10 min",
    tools: ["Flat hard surface", "Soft dry cloth"],
    safety: [
      "Shut down if the laptop becomes extremely hot, smells burnt, or the battery area bulges.",
      "Do not open the laptop unless you have the appropriate service instructions.",
    ],
    sourceTitle: "Microsoft Support",
    sourceUrl: "https://support.microsoft.com/",
    steps: [
      {
        title: "Check the surface",
        body: "Save your work and place the laptop on a hard, flat surface. Avoid beds, blankets, and cushions that block vents.",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
        alt: "Laptop on a desk",
      },
      {
        title: "Check ventilation",
        body: "Shut down and unplug the laptop. Visually check that external vents are not blocked by objects or fabric.",
        image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80",
        alt: "Laptop close-up",
      },
      {
        title: "Review running applications",
        body: "Restart the laptop and use Task Manager or Activity Monitor to identify unusually heavy CPU usage.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        alt: "Laptop in use",
      },
      {
        title: "Retest safely",
        body: "Monitor the temperature and fan noise. Persistent overheating may require model-specific service.",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        alt: "Computer workstation",
      },
    ],
  },
  {
    id: "headphones-audio-check",
    deviceType: "headphones",
    deviceLabel: "Headphones / Audio",
    title: "Headphones have no sound",
    issue: "No sound / connection",
    difficulty: "Beginner",
    duration: "5–10 min",
    tools: ["Clean dry cloth"],
    safety: [
      "Keep liquids away from ports and speakers.",
      "Do not dismantle sealed batteries or wireless earbuds.",
    ],
    sourceTitle: "Apple Support — AirPods",
    sourceUrl: "https://support.apple.com/airpods",
    steps: [
      {
        title: "Check volume and output",
        body: "Raise the volume, check mute, and confirm the headphones are selected as the audio output.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
        alt: "Audio equipment",
      },
      {
        title: "Reconnect the headphones",
        body: "For Bluetooth models, disconnect and reconnect them. For wired models, reseat the plug gently.",
        image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
        alt: "Headphones",
      },
      {
        title: "Check charge and pairing",
        body: "Charge wireless headphones and follow the manufacturer's pairing instructions.",
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
        alt: "Headphones on a surface",
      },
    ],
  },
  {
    id: "controller-button-check",
    deviceType: "controller",
    deviceLabel: "Game controller",
    title: "Controller button or connection problems",
    issue: "Button / connection problem",
    difficulty: "Beginner",
    duration: "10 min",
    tools: ["Console or computer settings"],
    safety: [
      "Do not open a controller while powered.",
      "Do not puncture or bend rechargeable battery packs.",
    ],
    sourceTitle: "PlayStation Support",
    sourceUrl: "https://www.playstation.com/support/",
    steps: [
      {
        title: "Check the battery and cable",
        body: "Charge the controller or try a known-working compatible cable. Inspect it for visible damage.",
        image: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=1200&q=80",
        alt: "Gaming controller",
      },
      {
        title: "Reconnect the controller",
        body: "Follow the console or computer manufacturer's pairing instructions.",
        image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1200&q=80",
        alt: "Gaming equipment",
      },
      {
        title: "Test the controls",
        body: "Use the platform's built-in controller test. Do not force stuck buttons; seek service if the problem remains.",
        image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1200&q=80",
        alt: "Gaming setup",
      },
    ],
  },
  {
    id: "other-device-check",
    deviceType: "other",
    deviceLabel: "Other gadget",
    title: "Gadget will not turn on",
    issue: "Power problem",
    difficulty: "Beginner",
    duration: "5–10 min",
    tools: ["Compatible power adapter", "Dry cloth"],
    safety: [
      "Do not open mains-powered devices.",
      "Stop if there is smoke, burning smell, liquid damage, excessive heat, or a swollen battery.",
    ],
    sourceTitle: "Google Support",
    sourceUrl: "https://support.google.com/",
    steps: [
      {
        title: "Identify the exact model",
        body: "Find the model number on the product label or in its settings. Consult the manufacturer's manual.",
        image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80",
        alt: "Electronic gadgets",
      },
      {
        title: "Check power safely",
        body: "Confirm the outlet works and use only a compatible, undamaged adapter.",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
        alt: "Electronic components",
      },
      {
        title: "Look for visible damage",
        body: "Check for cracks, liquid, heat damage, or a loose connector. Do not disassemble a battery-powered or mains-powered device.",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
        alt: "Electronics workstation",
      },
    ],
  },
];

export default function YouFix() {
  const [guides, setGuides] = useState(FALLBACK_GUIDES);
  const [deviceType, setDeviceType] = useState("phone");
  const [issue, setIssue] = useState("");
  const [model, setModel] = useState("");
  const [query, setQuery] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [activeGuide, setActiveGuide] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [message, setMessage] = useState("");

  const [deviceFamily, setDeviceFamily] = useState("iphone");
  const [selectedModel, setSelectedModel] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [phoneModels, setPhoneModels] = useState([]);
  const [modelSearch, setModelSearch] = useState("");
  const [selectedPhone, setSelectedPhone] = useState(null);

  const fileRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/youfix/guides`)
      .then((response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data.guides) && data.guides.length) {
          setGuides(data.guides);
        }
      })
      .catch(() => {
        setMessage(
          "Showing built-in starter guides. Start the backend to load its stored guide library."
        );
      });
  }, []);

  useEffect(() => {
    const defaultFamily = deviceType === "laptop" ? "windows" : "iphone";

    setDeviceFamily(defaultFamily);
    setSelectedModel("");
    setSelectedPhone(null);
    setModelNumber("");
    setModel("");
    setModelSearch("");
    setIssue("");
  }, [deviceType]);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  useEffect(() => {
    fetch(`${API_BASE}/api/youfix/models`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load phone models");
        return response.json();
      })
      .then((data) => {
        setPhoneModels(Array.isArray(data.models) ? data.models : []);
      })
      .catch((error) => {
        console.error("Phone model loading error:", error);
        setMessage(
          "Phone catalogue unavailable. You can enter your model manually."
        );
      });
  }, []);

  const deviceGuides = useMemo(
    () => guides.filter((guide) => guide.deviceType === deviceType),
    [guides, deviceType]
  );

  const filteredGuides = useMemo(
    () =>
      deviceGuides.filter((guide) => {
        const text =
          `${guide.title} ${guide.issue} ${guide.deviceLabel}`.toLowerCase();

        return (
          (!query || text.includes(query.toLowerCase())) &&
          (!issue || guide.issue === issue)
        );
      }),
    [deviceGuides, query, issue]
  );

  const availableModels = useMemo(() => {
    if (deviceType === "phone") return phoneModels;

    if (deviceType === "laptop") {
      return (DEVICE_MODELS[deviceFamily] || []).map((item, index) => ({
        id: `${deviceFamily}-${index}`,
        brand: item.manufacturer,
        name: item.name,
        modelNumber: "",
        family: deviceFamily,
        image: "",
      }));
    }

    return [];
  }, [deviceType, deviceFamily, phoneModels]);

  const visibleModels = useMemo(() => {
    const search = modelSearch.trim().toLowerCase();

    return availableModels.filter((item) => {
      const matchesFamily = item.family === deviceFamily;
      const text =
        `${item.brand || ""} ${item.name || ""} ${item.modelNumber || ""}`.toLowerCase();

      return matchesFamily && text.includes(search);
    });
  }, [availableModels, deviceFamily, modelSearch]);

  function handleFamilyChange(event) {
    setDeviceFamily(event.target.value);
    setSelectedModel("");
    setSelectedPhone(null);
    setModelNumber("");
    setModel("");
    setModelSearch("");
  }

  function handleModelChange(event) {
    const selected = availableModels.find(
      (item) => String(item.id) === event.target.value
    );

    setSelectedModel(selected?.name || "");
    setModel(selected?.name || "");
    setModelNumber(selected?.modelNumber || "");
    setSelectedPhone(deviceType === "phone" ? selected || null : null);
  }

  function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setMessage("Please choose an image smaller than 8 MB.");
      return;
    }

    if (photoUrl) URL.revokeObjectURL(photoUrl);

    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
    setMessage(
      "Photo added. It is previewed locally and is not automatically diagnosed."
    );
  }

  function openGuide(guide) {
    setActiveGuide(guide);
    setStepIndex(0);
    setCompleted([]);
  }

  function closeGuide() {
    setActiveGuide(null);
    setStepIndex(0);
  }

  function toggleComplete(index) {
    setCompleted((old) =>
      old.includes(index)
        ? old.filter((item) => item !== index)
        : [...old, index]
    );
  }

  return (
    <div className="youfix-page">
      <header className="youfix-hero">
        <div className="youfix-kicker">
          <span className="youfix-spark">✦</span> FIXIT DIY REPAIR STUDIO
        </div>
        <h1>
          Don't just fix it.
          <br />
          <span>YouFix it.</span>
        </h1>
        <p>
          Practical, safety-first guides to help you troubleshoot your gadgets
          at home—one step at a time.
        </p>
        <div className="youfix-hero-pills">
          <span>✓ Step-by-step guides</span>
          <span>✓ Tool checklists</span>
          <span>✓ Safety-first advice</span>
        </div>
      </header>

      {message && (
        <div className="youfix-message" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <section className="youfix-intake">
        <div className="youfix-section-title">
          <div>
            <span className="youfix-eyebrow">START HERE</span>
            <h2>What needs fixing?</h2>
          </div>
          <span className="youfix-step-tag">01 / DEVICE</span>
        </div>

        <div className="youfix-device-grid">
          {DEVICE_TYPES.map((device) => (
            <button
              key={device.id}
              className={`youfix-device-card ${
                deviceType === device.id ? "selected" : ""
              }`}
              onClick={() => setDeviceType(device.id)}
              type="button"
            >
              <span className="youfix-device-emoji">{device.emoji}</span>
              <span>{device.label}</span>
              <span className="youfix-device-radio">
                {deviceType === device.id ? "✓" : "+"}
              </span>
            </button>
          ))}
        </div>

        {(deviceType === "phone" || deviceType === "laptop") && (
          <>
            <div className="youfix-form-grid">
              <label>
                Device family
                <select value={deviceFamily} onChange={handleFamilyChange}>
                  {(DEVICE_FAMILIES[deviceType] || []).map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Search device model
                <input
                  type="search"
                  value={modelSearch}
                  onChange={(event) => setModelSearch(event.target.value)}
                  placeholder="Search iPhone, Samsung, OnePlus..."
                />

                <select
                  value={
                    deviceType === "phone"
                      ? selectedPhone?.id || ""
                      : availableModels.find(
                          (item) => item.name === selectedModel
                        )?.id || ""
                  }
                  onChange={handleModelChange}
                >
                  <option value="">Choose a matching model</option>
                  {visibleModels.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.brand} — {item.name}
                    </option>
                  ))}
                </select>

                <small>
                  Can't find your model? Enter it manually below.
                </small>
              </label>

              <label>
                Model number
                <input
                  value={modelNumber}
                  onChange={(event) => setModelNumber(event.target.value)}
                  placeholder="e.g. Axxxx or exact model code"
                />
              </label>
            </div>

            {deviceType === "phone" && selectedPhone && (
              <div className="youfix-selected-device">
                {selectedPhone.image && (
                  <img
                    src={selectedPhone.image}
                    alt={`${selectedPhone.brand} ${selectedPhone.name}`}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <div>
                  <h3>
                    {selectedPhone.brand} {selectedPhone.name}
                  </h3>
                  <p>
                    Model number: {modelNumber || "Not specified"}
                  </p>
                </div>
              </div>
            )}

            {deviceType === "laptop" && selectedModel && (
              <div className="youfix-selected-device">
                <div>
                  <h3>{selectedModel}</h3>
                  <p>
                    Model number: {modelNumber || "Enter the exact model number if known"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        <div className="youfix-form-grid">
          <label>
            What seems wrong?
            <select
              value={issue}
              onChange={(event) => setIssue(event.target.value)}
            >
              <option value="">All issues for this device</option>
              {[...new Set(deviceGuides.map((guide) => guide.issue))].map(
                (item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div className="youfix-upload-row">
          <input
            ref={fileRef}
            className="youfix-file-input"
            type="file"
            accept="image/*"
            onChange={handlePhoto}
          />
          <button
            className="youfix-upload"
            type="button"
            onClick={() => fileRef.current?.click()}
          >
            <span className="youfix-upload-icon">↥</span>
            <span>
              <strong>
                {photo ? "Change gadget photo" : "Add a photo of your gadget"}
              </strong>
              <small>JPG, PNG or WebP · up to 8 MB</small>
            </span>
          </button>

          {photoUrl && (
            <div className="youfix-photo-preview">
              <img src={photoUrl} alt="Your uploaded gadget" />
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  setPhotoUrl("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <p className="youfix-photo-note">
          Your photo is previewed locally. It is not uploaded to the server or
          automatically diagnosed.
        </p>
      </section>

      <section className="youfix-guides">
        <div className="youfix-section-title">
          <div>
            <span className="youfix-eyebrow">MATCHED TO YOUR DEVICE</span>
            <h2>Choose your repair guide</h2>
            <p>
              Start with safe checks. Follow your exact manufacturer's manual
              for model-specific disassembly.
            </p>
          </div>
          <span className="youfix-step-tag">02 / GUIDES</span>
        </div>

        <div className="youfix-guide-toolbar">
          <label className="youfix-search">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search symptoms or guide titles"
            />
          </label>
          <span className="youfix-results-count">
            {filteredGuides.length} guide
            {filteredGuides.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="youfix-guide-grid">
          {filteredGuides.map((guide) => (
            <article className="youfix-guide-card" key={guide.id}>
              <div className="youfix-guide-image">
                <img
                  src={guide.steps?.[0]?.image}
                  alt={guide.steps?.[0]?.alt || guide.title}
                  loading="lazy"
                />
                <span className="youfix-difficulty">{guide.difficulty}</span>
              </div>
              <div className="youfix-guide-body">
                <span className="youfix-guide-type">
                  {guide.deviceLabel} · {guide.duration}
                </span>
                <h3>{guide.title}</h3>
                <p>{guide.steps?.[0]?.body}</p>
                <div className="youfix-guide-footer">
                  <span>{guide.steps?.length || 0} steps</span>
                  <button type="button" onClick={() => openGuide(guide)}>
                    Open guide <span>↗</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredGuides.length === 0 && (
          <div className="youfix-empty">
            <span>⌕</span>
            <h3>No exact match yet</h3>
            <p>
              Try another symptom or choose a different device. Do not attempt
              internal repairs without a model-specific guide.
            </p>
          </div>
        )}
      </section>

      <footer className="youfix-safety">
        <span className="youfix-safety-icon">!</span>
        <div>
          <strong>Safety comes first</strong>
          <p>
            These starter guides cover basic checks and are not a substitute
            for model-specific service instructions. Stop if you notice
            swelling, smoke, burning smells, liquid damage, exposed wiring, or
            excessive heat. Do not open mains-powered devices or battery packs.
          </p>
        </div>
      </footer>

      {activeGuide && (
        <div
          className="youfix-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeGuide();
          }}
        >
          <section
            className="youfix-guide-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="youfix-modal-title"
          >
            <header className="youfix-modal-header">
              <div>
                <span className="youfix-eyebrow">
                  YOUFIX REPAIR WALKTHROUGH
                </span>
                <h2 id="youfix-modal-title">{activeGuide.title}</h2>
                <p>
                  {model ? `Your model: ${model} · ` : ""}
                  {activeGuide.difficulty} · {activeGuide.duration}
                </p>
              </div>
              <button
                className="youfix-close"
                type="button"
                onClick={closeGuide}
                aria-label="Close guide"
              >
                ×
              </button>
            </header>

            <div className="youfix-progress">
              <span
                style={{
                  width: `${
                    (completed.length / activeGuide.steps.length) * 100
                  }%`,
                }}
              />
            </div>

            <div className="youfix-modal-content">
              <aside className="youfix-step-list">
                {activeGuide.steps.map((step, index) => (
                  <button
                    key={step.title}
                    type="button"
                    className={`${stepIndex === index ? "active" : ""} ${
                      completed.includes(index) ? "done" : ""
                    }`}
                    onClick={() => setStepIndex(index)}
                  >
                    <span>
                      {completed.includes(index)
                        ? "✓"
                        : String(index + 1).padStart(2, "0")}
                    </span>
                    {step.title}
                  </button>
                ))}

                <div className="youfix-tools-box">
                  <strong>Before you start</strong>
                  <p>Tools: {(activeGuide.tools || []).join(", ")}</p>
                  {(activeGuide.safety || []).map((warning) => (
                    <p className="youfix-warning" key={warning}>
                      ⚠ {warning}
                    </p>
                  ))}
                </div>
              </aside>

              <div className="youfix-step-detail">
                <div className="youfix-step-image">
                  <img
                    src={activeGuide.steps[stepIndex]?.image}
                    alt={
                      activeGuide.steps[stepIndex]?.alt ||
                      activeGuide.steps[stepIndex]?.title
                    }
                  />
                </div>
                <div className="youfix-step-count">
                  STEP {String(stepIndex + 1).padStart(2, "0")} OF{" "}
                  {String(activeGuide.steps.length).padStart(2, "0")}
                </div>
                <h3>{activeGuide.steps[stepIndex]?.title}</h3>
                <p>{activeGuide.steps[stepIndex]?.body}</p>

                <label className="youfix-complete-check">
                  <input
                    type="checkbox"
                    checked={completed.includes(stepIndex)}
                    onChange={() => toggleComplete(stepIndex)}
                  />
                  Mark this step complete
                </label>

                <div className="youfix-step-actions">
                  <button
                    className="youfix-secondary-btn"
                    type="button"
                    disabled={stepIndex === 0}
                    onClick={() => setStepIndex((index) => index - 1)}
                  >
                    ← Previous
                  </button>

                  {stepIndex < activeGuide.steps.length - 1 ? (
                    <button
                      className="youfix-primary-btn"
                      type="button"
                      onClick={() => setStepIndex((index) => index + 1)}
                    >
                      Next step →
                    </button>
                  ) : (
                    <button
                      className="youfix-primary-btn"
                      type="button"
                      onClick={() => {
                        setMessage(
                          "Walkthrough finished. If the issue remains, use the official manufacturer support link or a qualified repair provider."
                        );
                        closeGuide();
                      }}
                    >
                      Finish guide ✓
                    </button>
                  )}
                </div>

                <a
                  className="youfix-source-link"
                  href={activeGuide.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Reference: {activeGuide.sourceTitle} ↗
                </a>

                <p className="youfix-image-disclaimer">
                  Images are illustrative device photos, not verified close-up
                  photographs of each exact repair action. Follow the linked
                  manufacturer guidance for your model.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
