import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Menu, X, ArrowRight, ChevronLeft, ChevronRight,
  Upload, RefreshCw, Shirt, Sparkles, Trash2, Heart
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/* Shared editorial shot used as the "Styled" gallery view — a stand-in
   until real per-SKU editorial photography exists. */
const STYLED_SHOT = "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=70";

/* ---------------------------------------------------------
   DATA — swap this for a real API / CMS call later.
   Keeping it as one typed array is what makes the grid,
   the filters, and the marquee all "dynamic" from one source.
   `views` powers the quick-view gallery: [Front, Detail, Styled].
   In production, replace with real per-angle product photography.
--------------------------------------------------------- */
/* Data is now fetched dynamically inside the VixaraSite component */

/* ---------------------------------------------------------
   Small hook: reveals an element with a class toggle once
   it scrolls into view. Used everywhere instead of a
   hard-coded "in" class, so any new section gets it free.
--------------------------------------------------------- */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.unobserve(el); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ as: Tag = "div", className = "", children, style }) {
  const [ref, visible] = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${visible ? "in" : ""} ${className}`} style={style}>
      {children}
    </Tag>
  );
}

function ProductCard({ product, onOpen, isFavorite, onToggleFavorite }) {
  return (
    <div className="piece" onClick={() => onOpen(product)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(product); }}>
      <button
        className={`favorite-pill ${isFavorite ? "active" : ""}`}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(product); }}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart size={14} strokeWidth={1.8} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      <img src={product.img} alt={`${product.brand} ${product.name}`} />
      <div className="seal">
        <ShieldCheck size={16} strokeWidth={1.5} />
        <div className="seal-text">VERIFIED<br />AUTHENTIC<br />{product.id}</div>
      </div>
      <div className="piece-info">
        <div className="piece-brand">{product.brand}</div>
        <div className="piece-name">{product.name}</div>
        <div className="piece-price">${product.price.toLocaleString()} · Size {product.size}</div>
      </div>
      <div className="quick-view-tag">Quick View</div>
    </div>
  );
}

/* ---------------------------------------------------------
   TRY-ON STUDIO
   A lightweight *styling preview*: the person uploads a photo,
   then drags/scales/rotates the garment cutout over it.
   This is a positioning overlay, not AI garment-fitting — real
   pixel-accurate fit (body pose warping) needs a dedicated
   virtual try-on model behind an API, which isn't wired up here.
--------------------------------------------------------- */
function TryOnStudio({ product }) {
  const [photo, setPhoto] = useState(null);
  const [t, setT] = useState({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 0.92 });
  const stageRef = useRef(null);
  const dragRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setT({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 0.92 });
    };
    reader.readAsDataURL(file);
  };

  const onPointerDown = (e) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: t.x, origY: t.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setT(prev => ({ ...prev, x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const reset = () => setT({ x: 0, y: 0, scale: 1, rotate: 0, opacity: 0.92 });

  return (
    <div className="tryon">
      {!photo ? (
        <label className="dropzone">
          <Upload size={26} strokeWidth={1.4} />
          <span>Upload a full-length photo</span>
          <span className="dropzone-sub">JPG or PNG · processed only in your browser for this preview</span>
          <input type="file" accept="image/*" onChange={onFile} hidden />
        </label>
      ) : (
        <>
          <div className="tryon-stage" ref={stageRef}>
            <img className="tryon-photo" src={photo} alt="Uploaded" />
            <img
              className="tryon-garment"
              src={product.img}
              alt={product.name}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{
                transform: `translate(-50%, -50%) translate(${t.x}px, ${t.y}px) rotate(${t.rotate}deg) scale(${t.scale})`,
                opacity: t.opacity,
              }}
              draggable={false}
            />
          </div>
          <div className="tryon-controls">
            <label>Size <input type="range" min="0.5" max="1.8" step="0.01" value={t.scale}
              onChange={e => setT(p => ({ ...p, scale: parseFloat(e.target.value) }))} /></label>
            <label>Angle <input type="range" min="-25" max="25" step="1" value={t.rotate}
              onChange={e => setT(p => ({ ...p, rotate: parseFloat(e.target.value) }))} /></label>
            <label>Opacity <input type="range" min="0.4" max="1" step="0.01" value={t.opacity}
              onChange={e => setT(p => ({ ...p, opacity: parseFloat(e.target.value) }))} /></label>
          </div>
          <div className="tryon-actions">
            <button className="btn-ghost small" onClick={reset}><RefreshCw size={14} /> Reset position</button>
            <label className="btn-ghost small as-label"><Upload size={14} /> Replace photo
              <input type="file" accept="image/*" onChange={onFile} hidden />
            </label>
            <button className="btn-ghost small" onClick={() => setPhoto(null)}><Trash2 size={14} /> Remove</button>
          </div>
        </>
      )}
      <p className="tryon-note">
        <Sparkles size={13} /> This is a quick styling preview — drag the garment into place over your photo.
        It isn't AI body-fitting; a production version would pair this with a dedicated virtual try-on model.
      </p>
    </div>
  );
}

function ProductModal({ product, onClose, isFavorite, onToggleFavorite }) {
  const [tab, setTab] = useState("gallery");
  const [viewIndex, setViewIndex] = useState(0);

  useEffect(() => {
    setTab("gallery");
    setViewIndex(0);
  }, [product]);

  useEffect(() => {
    if (!product) return;

    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [product, onClose]);

  if (!product) return null;
  const views = product.views;
  const view = views[viewIndex];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>

        <div className="modal-media">
          {tab === "gallery" ? (
            <>
              <div className="modal-image-wrap">
                <img src={view.img} alt={view.label} className={view.zoom ? "zoomed" : ""} />
                <span className="view-label mono">{view.label}</span>
                <button className="gallery-nav prev" onClick={() => setViewIndex(i => (i - 1 + views.length) % views.length)} aria-label="Previous view"><ChevronLeft size={18} /></button>
                <button className="gallery-nav next" onClick={() => setViewIndex(i => (i + 1) % views.length)} aria-label="Next view"><ChevronRight size={18} /></button>
              </div>
              <div className="thumbs">
                {views.map((v, i) => (
                  <button key={v.label} className={`thumb ${i === viewIndex ? "active" : ""}`} onClick={() => setViewIndex(i)}>
                    <img src={v.img} alt={v.label} className={v.zoom ? "zoomed" : ""} />
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <TryOnStudio product={product} />
          )}
        </div>

        <div className="modal-info">
          <div className="modal-tabs">
            <button className={tab === "gallery" ? "active" : ""} onClick={() => setTab("gallery")}>Views</button>
            <button className={tab === "tryon" ? "active" : ""} onClick={() => setTab("tryon")}><Shirt size={14} /> Try It On</button>
          </div>
          <div className="piece-brand">{product.brand}</div>
          <h3 className="display">{product.name}</h3>
          <div className="modal-price">${product.price.toLocaleString()} · Size {product.size}</div>
          <div className="modal-seal mono">
            <ShieldCheck size={14} /> VERIFIED AUTHENTIC — {product.id}
          </div>
          <p className="modal-desc">
            Inspected under Vixara's three-point standard: material verification, label and hardware cross-check,
            and a documented chain of custody. Ships with a numbered authentication card.
          </p>
          <button className={`btn-ghost small ${isFavorite ? "active-favorite" : ""}`} style={{ width: "100%", justifyContent: "center", marginBottom: 12 }} onClick={() => onToggleFavorite(product)}>
            <Heart size={14} strokeWidth={1.8} fill={isFavorite ? "currentColor" : "none"} /> {isFavorite ? "Saved to Favorites" : "Add to Favorites"}
          </button>
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Reserve This Piece <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FavoritesDrawer({ open, onClose, favorites, onToggleFavorite }) {
  return (
    <div className={`favorites-backdrop ${open ? "open" : ""}`} onClick={onClose}>
      <div className={`favorites-drawer ${open ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="favorites-head">
          <h3 className="display">Favorites</h3>
          <button className="modal-close static" onClick={onClose} aria-label="Close favorites"><X size={18} /></button>
        </div>
        {favorites.length === 0 ? (
          <div className="cart-empty">
            <Heart size={28} strokeWidth={1.2} />
            <p>Save pieces you love and they’ll stay here for later.</p>
          </div>
        ) : (
          <div className="favorites-list">
            {favorites.map((product) => (
              <div className="favorite-item" key={product.id}>
                <img src={product.img} alt={product.name} />
                <div>
                  <div className="piece-brand">{product.brand}</div>
                  <div className="favorite-item-name">{product.name}</div>
                  <div className="piece-price">${product.price.toLocaleString()} · Size {product.size}</div>
                </div>
                <button className="cart-remove" onClick={() => onToggleFavorite(product)} aria-label="Remove from favorites">
                  <Heart size={15} strokeWidth={1.8} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ShopifyCustomSection() {
  const [activePrice, setActivePrice] = useState(3240);
  const [discountPercent, setDiscountPercent] = useState(15);
  const [interestedOpen, setInterestedOpen] = useState(false);
  const [size, setSize] = useState("M");
  const [channel, setChannel] = useState("Email");
  const [clientEmail, setClientEmail] = useState("");
  const [interestedSubmitted, setInterestedSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [reason, setReason] = useState("Price point too high");
  const [notes, setNotes] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const pricing = calculateLaunchPricing(activePrice, discountPercent);

  const handleInterestedSubmit = (e) => {
    e.preventDefault();
    if (!clientEmail) return;
    registerCustomerInterestLead({ email: clientEmail, size, channel, price: activePrice });
    setInterestedSubmitted(true);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
  };

  const copyDiscountCode = () => {
    navigator.clipboard.writeText(pricing.discountCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="shopify-section-container" id="shopify-section">
      <div className="wrap">
        <div className="section-head" style={{ border: "none", marginBottom: 24, paddingTop: 10 }}>
          <div>
            <span className="tag">Shopify Custom Section</span>
            <h2>Vixara Concierge Product Page</h2>
          </div>
          <p>Test the interactive <strong>Interested</strong> chat funnel &amp; <strong>Not Interested</strong> feedback loop live.</p>
        </div>

        <div className="shopify-card-preview">
          <div className="shopify-card-img">
            <img src="https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=70" alt="Cashmere Overcoat" />
            <div className="seal-badge">AUTHENTICATED • VX-0417</div>
          </div>
          <div className="shopify-card-info">
            <span className="piece-brand">Loro Piana</span>
            <h3 className="display" style={{ fontSize: 34, margin: "8px 0 16px" }}>Cashmere Overcoat</h3>
            <div className="shopify-price-display">
              <span className="current-price">${pricing.finalPrice.toLocaleString()}</span>
              <span className="original-price">${pricing.originalPrice.toLocaleString()}</span>
              <span className="discount-tag">{pricing.discountPercent}% OFF VIP</span>
            </div>
            <p className="modal-desc" style={{ marginBottom: 28 }}>
              Inspected under Vixara's three-point standard: material verification, label and hardware cross-check,
              and a documented chain of custody. Reserved pieces include guaranteed size locking &amp; priority concierge.
            </p>
            <div className="shopify-btn-group">
              <button className="btn-primary" onClick={() => setInterestedOpen(true)}>
                <MessageSquare size={16} /> Interested • VIP Perks
              </button>
              <button className="btn-ghost" onClick={() => setFeedbackOpen(true)}>
                <ThumbsDown size={16} /> Not Interested
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Interested Modal */}
        {interestedOpen && (
        <div className="modal-backdrop" onClick={() => setInterestedOpen(false)}>
          <div className="modal-card-custom" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setInterestedOpen(false)}><X size={18} /></button>
            
            {!interestedSubmitted ? (
              <form onSubmit={handleInterestedSubmit}>
                <div className="chat-modal-head">
                  <h3 className="display">Vixara Concierge Chat</h3>
                  <p>Reserve size &amp; receive dynamic {pricing.discountPercent}% VIP discount</p>
                </div>

                <div className="form-group-custom">
                  <label>Select Preferred Size</label>
                  <div className="chip-row">
                    {["S", "M", "L", "XL", "Custom Fit"].map((s) => (
                      <button
                        type="button"
                        key={s}
                        className={`chip-btn ${size === s ? "active" : ""}`}
                        onClick={() => setSize(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group-custom">
                  <label>Communication Preference</label>
                  <div className="chip-row">
                    {["Email", "SMS", "WhatsApp"].map((c) => (
                      <button
                        type="button"
                        key={c}
                        className={`chip-btn ${channel === c ? "active" : ""}`}
                        onClick={() => setChannel(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group-custom">
                  <label>Your Email / Contact Information</label>
                  <input
                    type="email"
                    required
                    placeholder="client@domain.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="custom-input"
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Unlock Discount &amp; Reserve Size
                </button>
              </form>
            ) : (
              <div>
                <div className="chat-modal-head">
                  <h3 className="display">Size {size} Reserved ✓</h3>
                  <p>Client contact recorded via {channel}.</p>
                </div>
                <div className="discount-reward-box">
                  <span className="reward-label">{pricing.discountPercent}% OFF VIP DISCOUNT CODE</span>
                  <div className="discount-code-badge">
                    <span>{pricing.discountCode}</span>
                    <button type="button" className="copy-btn" onClick={copyDiscountCode}>
                      {copied ? "COPIED!" : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="reward-note">Final Reserved Price: <strong>${pricing.finalPrice.toLocaleString()}</strong> (Saved ${pricing.discountAmount.toLocaleString()})</p>
                  <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} onClick={() => setInterestedOpen(false)}>
                    <CheckCircle2 size={16} /> Proceed with Reserved Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Not Interested Feedback Modal */}
      {feedbackOpen && (
        <div className="modal-backdrop" onClick={() => setFeedbackOpen(false)}>
          <div className="modal-card-custom" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setFeedbackOpen(false)}><X size={18} /></button>
            {!feedbackSubmitted ? (
              <form onSubmit={handleFeedbackSubmit}>
                <div className="chat-modal-head">
                  <h3 className="display">Product Feedback</h3>
                  <p>Help us curate pieces tailored to your exact taste.</p>
                </div>

                <div className="form-group-custom">
                  <label>Why are you not interested in this piece?</label>
                  <div className="chip-row vertical">
                    {[
                      "Price point too high",
                      "Size unavailable",
                      "Not my personal style",
                      "Looking for another brand"
                    ].map((r) => (
                      <button
                        type="button"
                        key={r}
                        className={`chip-btn full ${reason === r ? "active" : ""}`}
                        onClick={() => setReason(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group-custom">
                  <label>Additional Notes (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us what you are looking for..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="custom-input"
                  />
                </div>

                <div className="form-group-custom">
                  <label>Notify me if price drops</label>
                  <input
                    type="email"
                    placeholder="Optional: client@domain.com"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    className="custom-input"
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Submit Feedback
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 size={38} style={{ color: "var(--brass-bright)", marginBottom: 12 }} />
                <h3 className="display" style={{ fontSize: 24, margin: "0 0 8px" }}>Feedback Received</h3>
                <p style={{ color: "var(--bone-dim)", fontSize: 14 }}>Thank you for helping us refine our Vixara catalog selection.</p>
                <button className="btn-ghost" style={{ marginTop: 20 }} onClick={() => setFeedbackOpen(false)}>Close Window</button>
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
}

export default function VixaraSite() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [email, setEmail] = useState("");
  const [requested, setRequested] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        const withViews = data.map(p => ({
          ...p,
          views: [
            { label: "Front", img: p.img, zoom: false },
            { label: "Detail", img: p.img, zoom: true },
            { label: "Styled", img: STYLED_SHOT, zoom: false },
          ]
        }));
        setProducts(withViews);
        setCategories(["All", ...new Set(withViews.map(p => p.category).filter(Boolean))]);
        setBrands([...new Set(withViews.map(p => p.brand).filter(Boolean))]);
      })
      .catch(err => console.error("Error fetching products:", err));
  }, []);

  const filtered = category === "All" ? products : products.filter(p => p.category === category);

  const toggleFavorite = useCallback((product) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      return exists ? prev.filter((item) => item.id !== product.id) : [...prev, product];
    });
  }, []);

  const isFavorite = useCallback((product) => favorites.some((item) => item.id === product.id), [favorites]);

  const submit = useCallback((e) => {
    e.preventDefault();
    if (!email) return;
    setRequested(true);
  }, [email]);

  const scrollToSection = useCallback((href, e) => {
    if (e) e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (!el) return;
    const y = window.scrollY + el.getBoundingClientRect().top - 92;
    window.scrollTo({ top: y, behavior: 'smooth' });
    setMenuOpen(false);
  }, []);

  return (
    <div className="vx-root">
      

      <header className={scrolled ? "scrolled" : ""}>
        <div className="logo">VIX<em>ARA</em></div>
        <div className="nav-links">
          <nav><ul>
            <li><a href="#shopify-section" onClick={(e) => scrollToSection('#shopify-section', e)}>Shopify Section</a></li>
            <li><a href="#collection" onClick={(e) => scrollToSection('#collection', e)}>Collection</a></li>
            <li><a href="#manifesto" onClick={(e) => scrollToSection('#manifesto', e)}>Provenance</a></li>
            <li><a href="#membership" onClick={(e) => scrollToSection('#membership', e)}>Access</a></li>
          </ul></nav>
          <a href="#membership" className="nav-cta" onClick={(e) => scrollToSection('#membership', e)}>Request Access</a>
        </div>
        <div className="header-actions">
          <button className="icon-btn" aria-label="Open favorites" onClick={() => setFavoritesOpen(true)}>
            <Heart size={20} strokeWidth={1.6} fill={favorites.length ? "currentColor" : "none"} />
            {favorites.length > 0 && <span className="icon-badge">{favorites.length}</span>}
          </button>
          <button className="menu-btn" aria-label="Toggle menu" onClick={() => setMenuOpen(m => !m)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div style={{position:"fixed",inset:0,zIndex:200,background:"var(--ink)",display:"flex",flexDirection:"column",padding:"90px 28px 28px"}}>
          <nav style={{display:"flex",flexDirection:"column",gap:28,fontSize:20,fontFamily:"'Fraunces',serif"}}>
            <a href="#collection" onClick={(e) => scrollToSection('#collection', e)}>Collection</a>
            <a href="#manifesto" onClick={(e) => scrollToSection('#manifesto', e)}>Provenance</a>
            <a href="#membership" onClick={(e) => scrollToSection('#membership', e)}>Access</a>
          </nav>
        </div>
      )}

      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-inner wrap">
          <div className="eyebrow">Est. 2026 · Verified Premium Only</div>
          <h1>Every piece,<br /><span className="accent">provenance</span> intact.</h1>
          <div className="hero-sub">
            <p>Vixara curates a closed circle of premium and designer garments — each one authenticated, catalogued, and sealed before it reaches you.</p>
            <div className="hero-actions">
              <a href="#collection" className="btn-primary" onClick={(e) => scrollToSection('#collection', e)}>Enter the Collection <ArrowRight size={15} /></a>
              <a href="#manifesto" className="btn-ghost" onClick={(e) => scrollToSection('#manifesto', e)}>Our Standard</a>
            </div>
          </div>
        </div>
      </section>

      <div className="seam-wrap"><div className="seam"></div></div>

      <div className="marquee-section">
        <div className="marquee-track">
          {[...brands, ...brands, ...brands].map((b, i) => <span key={i}>{b}</span>)}
        </div>
      </div>

      <ShopifyCustomSection />

      <section className="section" id="collection">
        <div className="wrap">
          <Reveal className="section-head">
            <div>
              <span className="tag">The Current Edit</span>
              <h2>{filtered.length} piece{filtered.length !== 1 ? "s" : ""}, one standard —<br />nothing enters unverified.</h2>
            </div>
            <p>Hover any piece to view its authentication seal and provenance code before you commit.</p>
          </Reveal>
          <Reveal className="filters">
            {categories.map(c => (
              <button
                key={c}
                className={`filter-btn ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </Reveal>
        </div>
        <div className="grid">
          {filtered.map(p => <ProductCard key={p.id} product={p} onOpen={setSelectedProduct} isFavorite={isFavorite(p)} onToggleFavorite={toggleFavorite} />)}
        </div>
      </section>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} isFavorite={selectedProduct ? isFavorite(selectedProduct) : false} onToggleFavorite={toggleFavorite} />
      <section className="section" id="manifesto" style={{paddingTop:0}}>
        <div className="wrap">
          <Reveal className="manifesto">
            <div className="manifesto-img">
              <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=60" alt="" />
            </div>
            <div>
              <p className="manifesto-quote">"A brand name means nothing on its own. <span className="brass">What we sell is certainty</span> — that the stitching, the label, the weight of the cloth, are exactly what they claim to be."</p>
              <p className="manifesto-cite">— Vixara Authentication Standard</p>
              <p className="manifesto-body">Every garment passes through a three-point inspection before it earns a Vixara seal: material verification, label and hardware cross-check, and a documented chain of custody. Nothing reaches the collection without all three.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{paddingTop:0}}>
        <div className="wrap">
          <Reveal className="section-head" style={{border:"none",marginBottom:40}}>
            <div><span className="tag">The Process</span><h2>How a piece earns its seal</h2></div>
            <p>Provenance codes are issued only once every check clears.</p>
          </Reveal>
        </div>
        <div className="wrap">
          <Reveal className="provenance">
            <div className="prov-item">
              <span className="prov-code">STAGE / 01</span>
              <h3>Sourced &amp; Sealed</h3>
              <p>Pieces are acquired directly from brand partners, licensed resellers, or verified private collections — never open marketplaces.</p>
            </div>
            <div className="prov-item">
              <span className="prov-code">STAGE / 02</span>
              <h3>Inspected in House</h3>
              <p>Our specialists examine stitching, hardware, and labelling against brand archives before anything is listed.</p>
            </div>
            <div className="prov-item">
              <span className="prov-code">STAGE / 03</span>
              <h3>Catalogued &amp; Shipped</h3>
              <p>Each piece ships with its provenance code, condition report, and a numbered authentication card.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="membership" id="membership">
        <Reveal className="wrap">
          <span className="tag">Private Access</span>
          <h2>New arrivals reach the <em>circle</em> before they reach the site.</h2>
          <form className="membership-form" onSubmit={submit}>
            <input
              type="email"
              placeholder="your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit">{requested ? "Requested ✓" : "Request Access"}</button>
          </form>
          {requested && <p className="membership-note">You're on the list — we'll be in touch before the next drop.</p>}
        </Reveal>
      </section>

      <FavoritesDrawer open={favoritesOpen} onClose={() => setFavoritesOpen(false)} favorites={favorites} onToggleFavorite={toggleFavorite} />

      <footer>
        <div className="wrap">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="logo">VIX<em>ARA</em></div>
              <p>A closed circle for verified premium and designer clothing. Every piece catalogued, every claim checked.</p>
            </div>
            <div className="footer-col">
              <h4>Shop</h4>
              <ul>
                <li><a href="#collection">Current Edit</a></li>
                <li><a href="#">Outerwear</a></li>
                <li><a href="#">Tailoring</a></li>
                <li><a href="#">Knitwear</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>House</h4>
              <ul>
                <li><a href="#manifesto">Our Standard</a></li>
                <li><a href="#">Authentication</a></li>
                <li><a href="#">Journal</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Client Care</h4>
              <ul>
                <li><a href="#">Shipping &amp; Returns</a></li>
                <li><a href="#">Concierge</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Vixara. All pieces verified.</span>
            <span>Privacy · Terms · Authentication Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
