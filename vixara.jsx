import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Menu, X, ArrowRight, ChevronLeft, ChevronRight,
  Upload, RefreshCw, Shirt, Sparkles, Trash2, Heart, MessageSquare,
  ThumbsDown, CheckCircle2, Copy, Zap, Bot, Clock, Flame, ShieldAlert,
  Send, CornerDownRight, Check, Play, Eye, Award
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://vixara-backend.onrender.com";

/* Shared editorial shot used as the "Styled" gallery view — a stand-in
   until real per-SKU editorial photography exists. */
const STYLED_SHOT = "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=70";

const INDIAN_WEAR_TYPES = [
  "Saree", "Ghagra Choli", "Anarkali Suit", "Indo-Western Suit",
  "Salwar Suit", "Kurta & Churidar", "Sharara Suit", "Gharara Suit",
  "Women's Sherwani", "Indian Gown", "Lancha", "Dhoti Kurta",
  "Temple Jhumkas", "Embroidered Potlis"
];

/* ---------------------------------------------------------
   SHOWCASE HERO PRESET METADATA (HAUTE COUTURE GARMENTS & WEAVES)
--------------------------------------------------------- */
const HERO_SHOWCASE_PRESETS = [
  {
    id: "VX-2001",
    sku: "CH-3123-PABL · VX-2001",
    edition: "LIMITED TO 15 PIECES",
    name: "BANARASI PURE SILK SAREE – ROYAL MAROON",
    brand: "Vixara Haute Couture",
    price: 4999,
    size: "Free",
    category: "Sarees",
    status: "Available",
    hue: "hue-sapphire",
    glowColor: "rgba(14, 116, 144, 0.45)",
    img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80",
    reelTitle: "Atelier Handloom Weaving",
    reelSub: "Varanasi Pure Zari · 120 Hours",
    reelImg: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=600&q=60"
  },
  {
    id: "VX-3001",
    sku: "CH-9343-CUBK · VX-3001",
    edition: "LIMITED TO 50 PIECES",
    name: "BRIDAL LEHENGA – HEAVY EMBROIDERY",
    brand: "Vixara Bridal Vault",
    price: 12999,
    size: "M",
    category: "Lehengas",
    status: "Coming Soon",
    drop_date: "Oct 20, 2026",
    hue: "hue-amber",
    glowColor: "rgba(216, 176, 119, 0.45)",
    img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=80",
    reelTitle: "Royal Zardozi Threadwork",
    reelSub: "Hand-stitched in Jaipur Atelier",
    reelImg: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=60"
  },
  {
    id: "VX-1001",
    sku: "CH-3715-BK · VX-1001",
    edition: "LIMITED TO 25 PIECES",
    name: "ANARKALI KURTI – ROSE GOLD THREAD",
    brand: "Vixara Signature",
    price: 1899,
    size: "M",
    category: "Kurtis",
    status: "Available",
    hue: "hue-emerald",
    glowColor: "rgba(16, 185, 129, 0.40)",
    img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80",
    reelTitle: "3-Point Provenance Check",
    reelSub: "Pure Silk Purity & Label Testing",
    reelImg: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=600&q=60"
  },
  {
    id: "VX-4001",
    sku: "CH-4001-GOLD · VX-4001",
    edition: "HERITAGE COLLECTOR PIECE",
    name: "TEMPLE GOLD JHUMKA EARRINGS",
    brand: "Vixara Jewels",
    price: 899,
    size: "Free",
    category: "Jhumkas",
    status: "Available",
    hue: "hue-ruby",
    glowColor: "rgba(225, 29, 72, 0.40)",
    img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80",
    reelTitle: "24K Gold Guilding & Pearls",
    reelSub: "Numbered Certificate of Provenance",
    reelImg: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=60"
  }
];

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
  const hasStatus = product.status && product.status !== "Available";

  return (
    <div 
      className="luxury-piece-card" 
      onClick={() => onOpen(product)} 
      role="button" 
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(product); }}
    >
      <div className="luxury-card-img-wrap">
        {/* Dynamic Status Badges */}
        {product.status === "Coming Soon" && (
          <div className="product-status-tag status-coming-soon">
            <Clock size={11} /> Coming Soon
          </div>
        )}
        {product.status === "Coming Back" && (
          <div className="product-status-tag status-coming-back">
            <Sparkles size={11} /> Restocking
          </div>
        )}
        {product.status === "Out of Stock" && (
          <div className="product-status-tag status-out-of-stock">
            <ShieldAlert size={11} /> Sold Out
          </div>
        )}

        <button
          className={`favorite-pill ${isFavorite ? "active" : ""} ${hasStatus ? "has-status" : ""}`}
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

        <div className="quick-view-tag">Inspect Piece</div>
      </div>

      <div className="luxury-card-meta">
        <div className="luxury-card-sku">{product.id} · {product.category || 'Atelier'}</div>
        <h3 className="luxury-card-name">{product.name}</h3>
        
        <div className="luxury-card-footer">
          <div className="luxury-card-price">${product.price.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "var(--bone-dim)", fontFamily: "'IBM Plex Mono', monospace" }}>
            Size {product.size || 'Free'}
          </div>
        </div>
      </div>
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

function AINegotiationModal({ product, onClose }) {
  const originalPrice = product.price;
  const [proposedPrice, setProposedPrice] = useState(Math.round(originalPrice * 0.88));
  const [round, setRound] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deal, setDeal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `Hello! I am Vixara's AI Valuation & Price Negotiation Agent. I've verified the provenance for "${product.name}" (${product.brand}). Standard retail is $${originalPrice.toLocaleString()}. What counter-offer would you like to propose?`
    }
  ]);

  const discountPercent = Math.round(((originalPrice - proposedPrice) / originalPrice) * 100);

  const handleSendOffer = async () => {
    if (loading || proposedPrice <= 0) return;
    setLoading(true);

    const userMsg = {
      sender: "user",
      text: `I would like to offer $${proposedPrice.toLocaleString()} (${discountPercent}% off valuation).`
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_URL}/api/negotiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          originalPrice,
          proposedPrice,
          round
        })
      });
      const data = await res.json();
      
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: data.message
        }
      ]);

      if (data.decision === "ACCEPTED") {
        setDeal(data);
      } else if (data.decision === "COUNTER_OFFER") {
        setProposedPrice(data.counterPrice);
        setRound(r => r + 1);
      }
    } catch (err) {
      // Intelligent local fallback if backend is offline
      const floor = Math.round(originalPrice * 0.80);
      if (proposedPrice >= floor) {
        const promoCode = `AI-VIP-${discountPercent}-${Math.floor(100 + Math.random() * 900)}`;
        const acceptedData = {
          decision: "ACCEPTED",
          agreedPrice: proposedPrice,
          discountPercent,
          promoCode,
          message: `✨ Deal Approved! Our AI Agent has accepted your offer of $${proposedPrice.toLocaleString()} (${discountPercent}% discount).`
        };
        setDeal(acceptedData);
        setMessages(prev => [...prev, { sender: "bot", text: acceptedData.message }]);
      } else {
        const counterPrice = Math.round(originalPrice * 0.85);
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `🤖 Vixara AI Agent: "We cannot meet $${proposedPrice.toLocaleString()}, but I can authorize an exclusive private collector price of $${counterPrice.toLocaleString()} (15% off)."`
          }
        ]);
        setProposedPrice(counterPrice);
        setRound(r => r + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyPromo = () => {
    if (!deal?.promoCode) return;
    navigator.clipboard.writeText(deal.promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div className="modal-card-custom ai-negotiate-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close negotiation"><X size={18} /></button>
        
        <div className="ai-avatar-header">
          <div className="ai-avatar-icon">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="display" style={{ fontSize: 20, margin: 0 }}>Vixara AI Negotiation Concierge</h3>
            <div className="ai-status-live">Agent Online • Real-Time Bargaining</div>
          </div>
        </div>

        <div className="ai-chat-thread">
          {messages.map((m, idx) => (
            <div key={idx} className={`ai-msg ${m.sender}`}>
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="ai-msg bot">
              <Sparkles size={14} className="spin" /> Calculating collector margin &amp; authentication criteria...
            </div>
          )}
        </div>

        {!deal ? (
          <div className="ai-offer-controls">
            <div className="offer-slider-row">
              <div>
                <span style={{ fontSize: 11, color: "var(--bone-dim)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Your Proposed Price</span>
                <div className="offer-price-tag">${proposedPrice.toLocaleString()}</div>
              </div>
              <div className="offer-discount-pill">
                {discountPercent > 0 ? `${discountPercent}% Below Retail` : "Catalog Price"}
              </div>
            </div>

            <input
              type="range"
              min={Math.round(originalPrice * 0.5)}
              max={originalPrice}
              step={50}
              value={proposedPrice}
              onChange={e => setProposedPrice(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--brass-bright)", cursor: "pointer", marginBottom: 14 }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, justifyContent: "center", padding: "12px 20px" }}
                onClick={handleSendOffer}
                disabled={loading}
              >
                <Bot size={14} /> Submit Offer to AI
              </button>
            </div>
          </div>
        ) : (
          <div className="ai-deal-voucher">
            <CheckCircle2 size={32} style={{ color: "#34d399", marginBottom: 8 }} />
            <h4 className="display" style={{ fontSize: 20, margin: "0 0 6px" }}>Agreement Reached: ${deal.agreedPrice.toLocaleString()}</h4>
            <p style={{ color: "var(--bone-dim)", fontSize: 13, margin: 0 }}>
              Your exclusive {deal.discountPercent}% price concession voucher is active:
            </p>
            <div className="discount-code-badge" style={{ borderColor: "#34d399", color: "#6ee7b7" }}>
              <span>{deal.promoCode}</span>
              <button type="button" className="copy-btn" onClick={copyPromo} style={{ background: "#34d399", color: "#000" }}>
                {copied ? "COPIED!" : <Copy size={14} />}
              </button>
            </div>
            <button className="btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={onClose}>
              Done / Return to Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, isFavorite, onToggleFavorite }) {
  const [tab, setTab] = useState("gallery");
  const [viewIndex, setViewIndex] = useState(0);

  // Interested Modal State
  const [interestedOpen, setInterestedOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product?.size || "M");
  const [channel, setChannel] = useState("WhatsApp");
  const [emailInput, setEmailInput] = useState("");
  const [interestedSubmitted, setInterestedSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Negotiation Modal State
  const [negotiateOpen, setNegotiateOpen] = useState(false);

  // Not Interested Modal State
  const [notInterestedOpen, setNotInterestedOpen] = useState(false);
  const [reason, setReason] = useState("Price point too high");
  const [notes, setNotes] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    setTab("gallery");
    setViewIndex(0);
    setInterestedOpen(false);
    setNegotiateOpen(false);
    setNotInterestedOpen(false);
    setInterestedSubmitted(false);
    setFeedbackSubmitted(false);
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

  const handleInterestedSubmit = (e) => {
    e.preventDefault();
    if (!emailInput) return;
    fetch(`${API_URL}/api/interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput,
        size: selectedSize,
        channel,
        price: product.price,
        productId: product.id
      })
    }).catch(err => console.error("Error saving lead:", err));
    setInterestedSubmitted(true);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: `${reason}${notes ? ` - ${notes}` : ""}`,
        productId: product.id
      })
    }).catch(err => console.error("Error saving feedback:", err));
    setFeedbackSubmitted(true);
  };

  const copyDiscount = () => {
    navigator.clipboard.writeText("STHREE-VIP-15");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          
          {product.status && product.status !== "Available" && (
            <div style={{ marginBottom: 12 }}>
              <span className={`product-status-tag ${product.status === "Coming Soon" ? "status-coming-soon" : product.status === "Coming Back" ? "status-coming-back" : "status-out-of-stock"}`} style={{ position: "static", display: "inline-flex" }}>
                {product.status} {product.drop_date ? `· ${product.drop_date}` : ""}
              </span>
            </div>
          )}

          <div className="modal-seal mono">
            <ShieldCheck size={14} /> VERIFIED AUTHENTIC — {product.id}
          </div>
          <p className="modal-desc">
            Inspected under Vixara's three-point standard: material verification, label and hardware cross-check,
            and a documented chain of custody. Ships with a numbered authentication card.
          </p>

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setInterestedOpen(true)}>
              <MessageSquare size={14} /> Interested • VIP Perks
            </button>
            <button className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setNotInterestedOpen(true)}>
              <ThumbsDown size={14} /> Pass
            </button>
          </div>

          {/* AI Negotiation Feature */}
          <button className="btn-ai-negotiate" style={{ width: "100%", marginBottom: 10 }} onClick={() => setNegotiateOpen(true)}>
            <Bot size={15} /> Negotiate Price (AI Agent)
          </button>

          <button className={`btn-ghost small ${isFavorite ? "active-favorite" : ""}`} style={{ width: "100%", justifyContent: "center" }} onClick={() => onToggleFavorite(product)}>
            <Heart size={14} strokeWidth={1.8} fill={isFavorite ? "currentColor" : "none"} /> {isFavorite ? "Saved to Favorites" : "Add to Favorites"}
          </button>
        </div>
      </div>

      {/* AI Negotiation Concierge Modal */}
      {negotiateOpen && (
        <AINegotiationModal product={product} onClose={() => setNegotiateOpen(false)} />
      )}

      {/* Interested Modal with Smart Channel Popup & Assistant */}
      {interestedOpen && (
        <div className="modal-backdrop" onClick={() => setInterestedOpen(false)} style={{ zIndex: 1100 }}>
          <div className="modal-card-custom" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setInterestedOpen(false)}><X size={18} /></button>
            {!interestedSubmitted ? (
              <form onSubmit={handleInterestedSubmit}>
                <div className="chat-modal-head">
                  <h3 className="display">STHREE VIP Concierge</h3>
                  <p>Reserve size &amp; unlock an exclusive 15% VIP Launch discount.</p>
                </div>

                {/* Popular Choice Proactive Tooltip / Notification */}
                <div className="smart-choice-tooltip">
                  <span className="popular-fire-badge">🔥 Popular Choice</span>
                  <span>78% of VIP clients select <strong>WhatsApp / SMS</strong> for instant one-click launch alerts.</span>
                </div>

                <div className="form-group-custom">
                  <label>Select Size</label>
                  <div className="chip-row">
                    {["S", "M", "L", "XL", "Free Size"].map((s) => (
                      <button type="button" key={s} className={`chip-btn ${selectedSize === s ? "active" : ""}`} onClick={() => setSelectedSize(s)}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="form-group-custom">
                  <label>Preferred Contact Channel</label>
                  <div className="chip-row">
                    {[
                      { id: "WhatsApp", tag: "HOT" },
                      { id: "SMS", tag: "FAST" },
                      { id: "Email", tag: "EASY" }
                    ].map((item) => (
                      <div key={item.id} className="chip-btn-wrap">
                        <button type="button" className={`chip-btn ${channel === item.id ? "active" : ""}`} onClick={() => setChannel(item.id)}>
                          {item.id}
                        </button>
                        <span className="popular-dot">{item.tag}</span>
                      </div>
                    ))}
                  </div>

                  {/* Channel Intelligence Help Box (Thinking in advance for Email vs SMS vs WhatsApp) */}
                  {channel === "WhatsApp" && (
                    <div className="channel-advice-box">
                      <Zap size={14} style={{ color: "var(--brass-bright)", flexShrink: 0, marginTop: 1 }} />
                      <div><strong>WhatsApp VIP:</strong> Instant 2-min direct chat with sizing specialist and secret access link.</div>
                    </div>
                  )}
                  {channel === "SMS" && (
                    <div className="channel-advice-box">
                      <Zap size={14} style={{ color: "var(--brass-bright)", flexShrink: 0, marginTop: 1 }} />
                      <div><strong>SMS Instant Alert:</strong> Super easy 1-click mobile confirmation. No clutter, zero spam.</div>
                    </div>
                  )}
                  {channel === "Email" && (
                    <div className="channel-advice-box">
                      <Sparkles size={14} style={{ color: "var(--brass-bright)", flexShrink: 0, marginTop: 1 }} />
                      <div><strong>Email Lookbook:</strong> Complete digital certificate, styling guide, and invoice sent to your inbox.</div>
                    </div>
                  )}
                </div>

                <div className="form-group-custom">
                  <label>Your {channel === "Email" ? "Email Address" : "Mobile / WhatsApp Number"}</label>
                  <input
                    type={channel === "Email" ? "email" : "text"}
                    required
                    placeholder={channel === "Email" ? "name@domain.com" : "+1 (555) 000-0000"}
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className="custom-input"
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  <Zap size={14} /> Unlock 15% Discount &amp; Reserve
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <CheckCircle2 size={36} style={{ color: "var(--brass-bright)", marginBottom: 12 }} />
                <h3 className="display" style={{ fontSize: 22 }}>Size {selectedSize} Reserved!</h3>
                <p style={{ color: "var(--bone-dim)", fontSize: 14 }}>Contact recorded via {channel}.</p>
                <div className="discount-reward-box" style={{ marginTop: 16 }}>
                  <span className="reward-label">EXCLUSIVE VIP CODE</span>
                  <div className="discount-code-badge">
                    <span>STHREE-VIP-15</span>
                    <button type="button" className="copy-btn" onClick={copyDiscount}>
                      {copied ? "COPIED!" : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <button className="btn-ghost" style={{ marginTop: 20, width: "100%" }} onClick={() => setInterestedOpen(false)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Not Interested Feedback Modal */}
      {notInterestedOpen && (
        <div className="modal-backdrop" onClick={() => setNotInterestedOpen(false)} style={{ zIndex: 1100 }}>
          <div className="modal-card-custom" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setNotInterestedOpen(false)}><X size={18} /></button>
            {!feedbackSubmitted ? (
              <form onSubmit={handleFeedbackSubmit}>
                <div className="chat-modal-head">
                  <h3 className="display">Product Feedback</h3>
                  <p>Help us curate pieces tailored to your exact taste.</p>
                </div>
                <div className="form-group-custom">
                  <label>Reason for passing</label>
                  <div className="chip-row vertical">
                    {["Price point too high", "Size unavailable", "Not my personal style", "Looking for another brand"].map((r) => (
                      <button type="button" key={r} className={`chip-btn full ${reason === r ? "active" : ""}`} onClick={() => setReason(r)}>{r}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group-custom">
                  <label>Notes (Optional)</label>
                  <textarea rows={2} placeholder="What style or fabric are you looking for?" value={notes} onChange={e => setNotes(e.target.value)} className="custom-input" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Submit Feedback
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <CheckCircle2 size={36} style={{ color: "var(--brass-bright)", marginBottom: 12 }} />
                <h3 className="display" style={{ fontSize: 22 }}>Feedback Received</h3>
                <p style={{ color: "var(--bone-dim)", fontSize: 14 }}>Thank you for helping us curate our collection.</p>
                <button className="btn-ghost" style={{ marginTop: 20, width: "100%" }} onClick={() => setNotInterestedOpen(false)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
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


/* =========================================================
   GRAND SHOWCASE HERO COMPONENT (CHRONOSWISS-INSPIRED LUXURY FOR GARMENTS)
   ========================================================= */
function GrandShowcaseHero({ products = [], onOpen, onNegotiate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState('next');

  // Combine database products with rich showcase metadata
  const showcaseItems = HERO_SHOWCASE_PRESETS.map((preset) => {
    const matchingDb = products.find(p => p.id === preset.id || p.category === preset.category);
    if (matchingDb) {
      return {
        ...preset,
        ...matchingDb,
        sku: preset.sku,
        edition: preset.edition,
        hue: preset.hue,
        glowColor: preset.glowColor,
        img: matchingDb.img || preset.img,
        reelTitle: preset.reelTitle,
        reelSub: preset.reelSub,
        reelImg: preset.reelImg
      };
    }
    return preset;
  });

  const total = showcaseItems.length;
  const current = showcaseItems[currentIndex] || showcaseItems[0];
  const prevItem = showcaseItems[(currentIndex - 1 + total) % total];
  const nextItem = showcaseItems[(currentIndex + 1) % total];

  const goNext = useCallback(() => {
    setDirection('next');
    setCurrentIndex(i => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setDirection('prev');
    setCurrentIndex(i => (i - 1 + total) % total);
  }, [total]);

  const goToIndex = useCallback((idx) => {
    setDirection(idx >= currentIndex ? 'next' : 'prev');
    setCurrentIndex(idx);
  }, [currentIndex]);

  return (
    <section 
      className={`grand-showcase ${current.hue || 'hue-sapphire'}`}
    >
      <div className="wrap" style={{ width: "100%" }}>
        
        {/* Main 3-Column Stage Grid */}
        <div className="grand-stage-grid">
          
          {/* Left Column: Data, Badge & Call To Actions */}
          <div className="hero-info-col">
            <div className="hero-sku-code">
              <ShieldCheck size={14} style={{ color: "var(--brass-bright)" }} />
              {current.sku || `VX-${current.id}`}
            </div>
            <h1 
              className={`hero-grand-title ${direction === 'next' ? 'slide-in-right' : 'slide-in-left'}`} 
              key={`title-${current.id}-${currentIndex}`}
            >
              {current.name}
            </h1>
            <div 
              className={`hero-meta-row ${direction === 'next' ? 'slide-in-right' : 'slide-in-left'}`} 
              key={`meta-${current.id}-${currentIndex}`}
            >
              <span className="hero-price-tag">${current.price.toLocaleString()}</span>
              <span className="hero-availability-tag">
                <CheckCircle2 size={13} /> {current.status || 'AVAILABLE'}
              </span>
            </div>
            
            <div className="hero-cta-group">
              <button 
                className={current.hue === 'hue-amber' ? 'btn-pill-gold' : 'btn-pill-cyan'}
                onClick={() => onOpen(current)}
              >
                <Eye size={14} /> Explore Piece
              </button>
              <button 
                className="btn-pill-ghost"
                onClick={() => onNegotiate(current)}
              >
                <Bot size={14} /> Negotiate Price
              </button>
            </div>
          </div>

          {/* Center Column: Grounded Garment Stage with Smooth Horizontal Right/Left Slide */}
          <div 
            className="hero-center-stage" 
            onClick={() => onOpen(current)}
            title="Click to view full inspection & try-on"
          >
            <div className="hero-floating-visual-wrap">
              <div 
                className="hero-floating-glow" 
                style={{ background: current.glowColor || 'rgba(14, 116, 144, 0.4)' }}
              />
              {showcaseItems.map((item, idx) => {
                let slideClass = "active-slide";
                if (idx !== currentIndex) {
                  const diff = (idx - currentIndex + total) % total;
                  slideClass = (diff === 1 || (diff > 1 && direction === 'next')) ? 'slide-right' : 'slide-left';
                }
                return (
                  <img 
                    key={item.id}
                    src={item.img} 
                    alt={item.name} 
                    className={`hero-floating-img ${slideClass}`} 
                  />
                );
              })}
              <div className="hero-inspect-hint">
                <Sparkles size={12} /> Click to Inspect &amp; Try-On
              </div>
            </div>
          </div>

          {/* Right Column: Atelier Craftsmanship Reel */}
          <div 
            className="hero-reel-card"
            onClick={() => onOpen(current)}
          >
            <div className="hero-reel-thumb-wrap">
              <img src={current.reelImg} alt="Atelier Craftsmanship" />
              <div className="pulse-play-btn">
                <Play size={16} fill="currentColor" />
              </div>
            </div>
            <div className="hero-reel-meta">
              <h5>{current.reelTitle || 'Handloom Craftsmanship'}</h5>
              <p>{current.reelSub || 'Authentic Varanasi atelier weaving process'}</p>
            </div>
          </div>

        </div>

        {/* Bottom Dial & Slide Navigator (The Chronoswiss-Style Dial) */}
        <div className="hero-dial-navigator">
          
          {/* Previous Piece Ticker */}
          <div className="hero-nav-ticker" onClick={goPrev}>
            <ChevronLeft size={16} />
            <span>{prevItem.name.split('–')[0].slice(0, 24)}</span>
          </div>

          {/* Center Numbered Step Gauge Dial */}
          <div className="dial-track-container">
            <div className="dial-gauge">
              {showcaseItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`dial-step-node ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => goToIndex(idx)}
                >
                  <span className="dial-tick" />
                  <span className="dial-dot">0{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Piece Ticker */}
          <div className="hero-nav-ticker" onClick={goNext}>
            <span>{nextItem.name.split('–')[0].slice(0, 24)}</span>
            <ChevronRight size={16} />
          </div>

        </div>

      </div>
    </section>
  );
}

/* =========================================================
   ATELIER CRAFTSMANSHIP & PROVENANCE STORY STRIP
   ========================================================= */
function CraftsmanshipStrip({ onExploreClick }) {
  return (
    <section className="craft-strip-section">
      <div className="wrap">
        <div className="craft-strip-grid">
          
          <div className="craft-story-card" onClick={onExploreClick}>
            <div className="craft-story-img-box">
              <img src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=240&q=80" alt="Master Weaver" />
            </div>
            <div className="craft-story-text">
              <span>HERITAGE ATELIER</span>
              <h4>Master Handloom Guild</h4>
              <p>Over 120+ artisan hours woven into each pure silk piece.</p>
            </div>
          </div>

          <div className="craft-story-card" onClick={onExploreClick}>
            <div className="craft-story-img-box">
              <img src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=240&q=80" alt="Zari Test" />
            </div>
            <div className="craft-story-text">
              <span>MATERIAL ASSURANCE</span>
              <h4>Pure Zari &amp; Silk Lab Tested</h4>
              <p>24K gold electroplated zari &amp; authenticated weave density.</p>
            </div>
          </div>

          <div className="craft-story-card" onClick={onExploreClick}>
            <div className="craft-story-img-box">
              <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=240&q=80" alt="Provenance Certificate" />
            </div>
            <div className="craft-story-text">
              <span>CHAIN OF CUSTODY</span>
              <h4>Tamper-Proof Provenance</h4>
              <p>Individually serialized physical certificate of authenticity.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* =========================================================
   LIVE ATELIER ACTIVITY & CONCIERGE PULSE BAR
   ========================================================= */
const LIVE_PULSE_UPDATES = [
  {
    type: "Reservation",
    text: "VIP Connoisseur in Mayfair reserved Varanasi Katan Silk Saree (VX-2001)",
    time: "2m ago",
    sku: "VX-2001"
  },
  {
    type: "AI Concierge",
    text: "Private offer accepted: -10% on Royal Jaipur Zardozi Lehenga",
    time: "6m ago",
    sku: "VX-3001"
  },
  {
    type: "Certification",
    text: "Forensic Weave Provenance Seal issued for Emerald Green Anarkali",
    time: "14m ago",
    sku: "VX-2004"
  },
  {
    type: "Vault Drop",
    text: "Restock Alert: Only 2 pieces remaining in Kanjivaram Korvai Silk Edition",
    time: "28m ago",
    sku: "VX-2002"
  }
];

function LiveAtelierPulseBar({ onExplorePiece }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % LIVE_PULSE_UPDATES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const cur = LIVE_PULSE_UPDATES[activeIdx];

  return (
    <div className="atelier-pulse-bar">
      <div className="wrap">
        <div className="pulse-bar-inner">
          <div className="pulse-badge">
            <span className="live-dot" />
            <span>Live Atelier Activity</span>
          </div>

          <div className="pulse-message-wrap">
            <span className="pulse-time">{cur.time}</span>
            <span className="pulse-message-text">{cur.text}</span>
          </div>

          <button 
            className="pulse-action-btn"
            onClick={() => onExplorePiece && onExplorePiece(cur.sku)}
          >
            <Sparkles size={12} /> Explore Feed
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   OCCASION & SILHOUETTE STYLIST CONCIERGE
   ========================================================= */
const OCCASION_PRESETS = [
  {
    id: "bridal",
    label: "Royal Wedding / Bridal",
    icon: "👑",
    vibe: "Maximalist 24K Gold Zari · Heirloom Katan Silks & Royal Red Zardozi",
    garments: [
      {
        id: "VX-3001",
        name: "Jaipur Heavy Zardozi Bridal Lehenga",
        tag: "Imperial Bridal",
        craft: "240 Artisan Hours",
        price: 12999,
        img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "VX-2001",
        name: "Banarasi Pure Katan Silk Saree – Royal Maroon",
        tag: "Heritage Weave",
        craft: "180 Artisan Hours",
        price: 4999,
        img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "VX-4001",
        name: "Handcrafted 22K Gold Temple Jhumkas & Haar",
        tag: "Heirloom Jewels",
        craft: "Hand-cast Jadau",
        price: 3850,
        img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: "sangeet",
    label: "Sangeet & Cocktail Soirée",
    icon: "🌙",
    vibe: "Dramatic Velvet Drape · Sapphire Georgette & Modern Shararas",
    garments: [
      {
        id: "VX-2003",
        name: "Nocturnal Sapphire Blue Georgette Sharara Set",
        tag: "Soirée Drape",
        craft: "110 Artisan Hours",
        price: 2850,
        img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "VX-2005",
        name: "Kashmiri Silk Velvet Kurti Set – Midnight Gold",
        tag: "Royal Velvet",
        craft: "140 Artisan Hours",
        price: 3200,
        img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "VX-4002",
        name: "Uncut Emerald Kundan Polki Choker Set",
        tag: "Heritage Jewels",
        craft: "Meenakari Inlay",
        price: 2450,
        img: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: "gala",
    label: "Heritage Reception & Gala",
    icon: "🏛️",
    vibe: "Regal Silhouettes · Handloom Organza & Temple Korvai Silks",
    garments: [
      {
        id: "VX-2002",
        name: "Pure Kanjivaram Korvai Silk Saree – Gold Zari",
        tag: "South Handloom",
        craft: "210 Artisan Hours",
        price: 5400,
        img: "https://images.unsplash.com/photo-1610030469668-93510cb67655?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "VX-2004",
        name: "Ivory Lucknowi Chikankari & Mukaish Anarkali",
        tag: "Awadh Atelier",
        craft: "220 Artisan Hours",
        price: 3950,
        img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "VX-4003",
        name: "Antique Victorian Polki Emerald Kada Pair",
        tag: "Temple Kada",
        craft: "Master Goldsmith",
        price: 1950,
        img: "https://images.unsplash.com/photo-1611591475152-47e2a149023f?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: "festive",
    label: "Festive Puja & Temple Celebrations",
    icon: "🪔",
    vibe: "Auspicious Amber Tones · Pure Mulberry Warp & Lightweight Zari",
    garments: [
      {
        id: "VX-2006",
        name: "Amber Mustard Banarasi Brocade Kurti Ensemble",
        tag: "Festive Classic",
        craft: "95 Artisan Hours",
        price: 1850,
        img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "VX-2007",
        name: "Crimson Tussar Silk Hand-Embroidered Saree",
        tag: "Tussar Handloom",
        craft: "130 Artisan Hours",
        price: 2600,
        img: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "VX-4004",
        name: "Hand-Crafted Gold Temple Pendant & Jhumka Set",
        tag: "Temple Gold",
        craft: "22K Hallmark",
        price: 1250,
        img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80"
      }
    ]
  }
];

function OccasionSilhouetteMatcher({ onOpen, onNegotiate }) {
  const [activeOccasion, setActiveOccasion] = useState(OCCASION_PRESETS[0].id);
  const current = OCCASION_PRESETS.find(o => o.id === activeOccasion) || OCCASION_PRESETS[0];

  return (
    <section className="occasion-section" id="occasions">
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="tag" style={{ color: "var(--brass-bright)" }}>Atelier Stylist Concierge</span>
            <h2>Curated by Occasion —<br />master the royal dress code.</h2>
          </div>
          <p>Select your royal celebration to uncover certified weaves, artisan silhouettes, and private AI-negotiable heirlooms.</p>
        </Reveal>

        <div className="occasion-pills-wrap">
          {OCCASION_PRESETS.map((occ) => (
            <button
              key={occ.id}
              className={`occasion-pill-btn ${activeOccasion === occ.id ? 'active' : ''}`}
              onClick={() => setActiveOccasion(occ.id)}
            >
              <span>{occ.icon}</span>
              <span>{occ.label}</span>
            </button>
          ))}
        </div>

        <div className="occasion-vibe-bar">
          <div className="occasion-vibe-title">
            <Sparkles size={14} /> Dress Code &amp; Palette
          </div>
          <div className="occasion-vibe-text">{current.vibe}</div>
        </div>

        <div className="occasion-cards-grid">
          {current.garments.map((g) => (
            <div key={g.id} className="occasion-card">
              <div className="occasion-card-img-wrap">
                <img src={g.img} alt={g.name} />
                <span className="occasion-card-tag">{g.tag}</span>
              </div>
              <div className="occasion-card-body">
                <h4 className="occasion-card-title">{g.name}</h4>
                <div className="occasion-card-meta">
                  <span>{g.craft}</span>
                  <span className="occasion-card-price">${g.price.toLocaleString()}</span>
                </div>
                <div className="occasion-card-actions">
                  <button 
                    className="occasion-btn-inspect"
                    onClick={() => onOpen(g)}
                  >
                    <Eye size={13} /> Inspect
                  </button>
                  <button 
                    className="occasion-btn-negotiate"
                    onClick={() => onNegotiate(g)}
                  >
                    <Bot size={13} /> Negotiate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

/* =========================================================
   FABRIC & ZARI SENSORY STUDIO (THE ATELIER ANATOMY)
   ========================================================= */
const FABRIC_STUDIO_PRESETS = [
  {
    id: "zari",
    name: "24K Real Gold Zari & Katan Silk",
    badge: "Varanasi Master Guild",
    desc: "Spun from 22-micron silver core wires electroplated in 24-karat gold, woven alongside Mulberry silk warp on heritage pit looms. Never tarnishes or oxidises.",
    img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80",
    metrics: [
      { label: "Weave Time", value: "180+ Hours" },
      { label: "Fabric Density", value: "580 GSM" },
      { label: "Metallurgy", value: "24K Gold Over Silver" },
      { label: "Loom Type", value: "Varanasi Pit Loom" }
    ],
    hotspots: [
      { top: "35%", left: "45%", title: "24K Gold Zari Warp", note: "Certified 22-micron electroplated silver wire" },
      { top: "65%", left: "60%", title: "Kadwa Buta Motif", note: "Individually hand-locked motif threads with no floating back yarns" },
      { top: "50%", left: "25%", title: "Grade 6A Mulberry Silk", note: "High-twist warp with natural high sheen" }
    ]
  },
  {
    id: "kanjivaram",
    name: "Pure Mulberry Korvai Silk",
    badge: "Kanchipuram Silk Mark",
    desc: "Features the legendary Korvai interlocking technique where the border and body are woven with three shuttles simultaneously, yielding unbreakable temple seam strength.",
    img: "https://images.unsplash.com/photo-1610030469668-93510cb67655?auto=format&fit=crop&w=1000&q=80",
    metrics: [
      { label: "Weave Time", value: "210+ Hours" },
      { label: "Fabric Density", value: "620 GSM Heavy" },
      { label: "Yarn Construction", value: "3-Ply Twisted Silk" },
      { label: "Interlocking", value: "Petni Temple Seam" }
    ],
    hotspots: [
      { top: "30%", left: "55%", title: "Korvai Triple-Shuttle Seam", note: "Interlocked body-to-border weave without machine stitches" },
      { top: "70%", left: "40%", title: "Temple Spire Zari Border", note: "Pure silver zari with geometric sacred architecture motifs" }
    ]
  },
  {
    id: "chikankari",
    name: "Awadh Hand Chikankari & Mukaish",
    badge: "Lucknow Heritage Atelier",
    desc: "An ethereal marriage of 32 intricate shadow-stitch embroidery techniques on superfine sheer organza, accented with flat metallic Mukaish silver badla work.",
    img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80",
    metrics: [
      { label: "Needlework Time", value: "240+ Hours" },
      { label: "Stitch Variety", value: "32 Heritage Stitches" },
      { label: "Base Fabric", value: "Mulberry Silk Organza" },
      { label: "Embellishment", value: "Pure Silver Badla Mukaish" }
    ],
    hotspots: [
      { top: "40%", left: "50%", title: "Phanda & Bakhiya Stitches", note: "Microscopic floral knots creating embossed shadow relief" },
      { top: "60%", left: "35%", title: "Mukaish Badla Inlay", note: "Hand-flattened silver dots embedded between silk meshes" }
    ]
  },
  {
    id: "velvet",
    name: "Kashmiri Silk Velvet & Antique Tilla",
    badge: "Srinagar Craft Council",
    desc: "Deep nocturnal silk-blend velvet ground embellished with Kashmiri Tilla gold needlework depicting Chinar leaves, Persian paisleys, and floral medallions.",
    img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80",
    metrics: [
      { label: "Embroidery Time", value: "160+ Hours" },
      { label: "Pile Density", value: "480 GSM Micro-Pile" },
      { label: "Metallic Cord", value: "Silver-Gilt Tilla Thread" },
      { label: "Provenance", value: "Kashmir Valley Atelier" }
    ],
    hotspots: [
      { top: "35%", left: "50%", title: "Antique Silver Tilla Wire", note: "Pure silver-plated metallic thread hammered into the velvet ground" },
      { top: "70%", left: "60%", title: "Lush Micro-Pile Velvet", note: "Ultra-soft drape with opulent light-absorbing luster" }
    ]
  }
];

function AtelierFabricStudio({ onOpenCatalog }) {
  const [activeTab, setActiveTab] = useState(FABRIC_STUDIO_PRESETS[0].id);
  const [activeHotspot, setActiveHotspot] = useState(null);

  const current = FABRIC_STUDIO_PRESETS.find(f => f.id === activeTab) || FABRIC_STUDIO_PRESETS[0];

  return (
    <section className="fabric-studio-section" id="anatomy">
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="tag" style={{ color: "var(--brass-bright)" }}>The Atelier Anatomy</span>
            <h2>Microscopic Weave Studio —<br />touch the pedigree of certified cloth.</h2>
          </div>
          <p>Inspect the metallurgy of 24k zari, warp densities, and generational handloom techniques verified under forensic gemological standards.</p>
        </Reveal>

        <div className="fabric-studio-layout">
          
          {/* Visual Display with Glowing Interactive Hotspot Radar Pins */}
          <div className="fabric-macro-display">
            <img src={current.img} alt={current.name} className="fabric-macro-img" />
            <div className="fabric-macro-overlay" />

            {current.hotspots.map((h, i) => (
              <div 
                key={i} 
                className={`fabric-hotspot ${activeHotspot === i ? 'active' : ''}`}
                style={{ top: h.top, left: h.left }}
                onMouseEnter={() => setActiveHotspot(i)}
                onMouseLeave={() => setActiveHotspot(null)}
                onClick={() => setActiveHotspot(activeHotspot === i ? null : i)}
              >
                <div className="hotspot-radar">
                  <div className="hotspot-dot" />
                </div>
                <div className="hotspot-tooltip">
                  <strong>{h.title}</strong>
                  <br />
                  <span style={{ color: "var(--bone-dim)", fontSize: "10px" }}>{h.note}</span>
                </div>
              </div>
            ))}

            <div className="fabric-macro-badge">
              <ShieldCheck size={14} /> {current.badge}
            </div>
          </div>

          {/* Interactive Information & Guild Specs */}
          <div className="fabric-info-col">
            <div className="fabric-nav-tabs">
              {FABRIC_STUDIO_PRESETS.map((f) => (
                <button
                  key={f.id}
                  className={`fabric-tab-btn ${activeTab === f.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(f.id);
                    setActiveHotspot(null);
                  }}
                >
                  {f.name.split('–')[0].split('&')[0]}
                </button>
              ))}
            </div>

            <h3 className="fabric-lead-title">{current.name}</h3>
            <p className="fabric-lead-desc">{current.desc}</p>

            <div className="fabric-metrics-grid">
              {current.metrics.map((m, i) => (
                <div key={i} className="fabric-metric-card">
                  <span className="fabric-metric-lbl">{m.label}</span>
                  <span className="fabric-metric-val">{m.value}</span>
                </div>
              ))}
            </div>

            <button 
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={onOpenCatalog}
            >
              <Eye size={15} /> Explore {current.name.split(' ')[0]} Masterpieces
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}

/* =========================================================
   ROYAL ENSEMBLE LOOKBOOK ("SHOP THE LOOK")
   ========================================================= */
const ROYAL_LOOKBOOK_PRESETS = [
  {
    id: "look-1",
    title: "The Varanasi Maharani",
    tag: "Ensemble 01 · Royal Wedding",
    desc: "A timeless bridal edit pairing a handwoven heavy zari Banarasi Katan silk saree with antique 22K temple jewellery and a hand-stitched zardozi potli.",
    modelImg: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80",
    totalVal: 7299,
    pieces: [
      {
        name: "Banarasi Pure Katan Silk Saree",
        type: "Couture Garment",
        price: 4999,
        img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=160&q=80"
      },
      {
        name: "22K Gold Temple Jadau Choker Set",
        type: "Heirloom Jewellery",
        price: 1850,
        img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=160&q=80"
      },
      {
        name: "Hand-Embroidered Zardozi Silk Potli",
        type: "Atelier Accessory",
        price: 450,
        img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=160&q=80"
      }
    ]
  },
  {
    id: "look-2",
    title: "The Midnight Velvet Soirée",
    tag: "Ensemble 02 · Sangeet & Gala",
    desc: "Sumptuous indigo micro-velvet tailored with antique silver tilla needlework, complemented by unblemished Emerald Polki and pure organza drape.",
    modelImg: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80",
    totalVal: 6150,
    pieces: [
      {
        name: "Royal Indigo Silk Velvet Kurta & Sharara",
        type: "Couture Garment",
        price: 3400,
        img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=160&q=80"
      },
      {
        name: "Uncut Emerald Kundan Polki Choker Set",
        type: "Heirloom Jewellery",
        price: 2100,
        img: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=160&q=80"
      },
      {
        name: "Fine Organza Zari Scallop Dupatta",
        type: "Atelier Accessory",
        price: 650,
        img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=160&q=80"
      }
    ]
  },
  {
    id: "look-3",
    title: "The Imperial Bridal Empress",
    tag: "Ensemble 03 · Grand Ceremony",
    desc: "A monumental 16-kali Jaipur bridal lehenga layered with real gold zardozi, matched with an archival Jadau Navratna necklace and tissue veil.",
    modelImg: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80",
    totalVal: 18699,
    pieces: [
      {
        name: "Crimson Gold Zardozi Bridal Lehenga",
        type: "Couture Garment",
        price: 12999,
        img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=160&q=80"
      },
      {
        name: "Heritage Jadau Navratna Haar & Mathapatti",
        type: "Heirloom Jewellery",
        price: 4500,
        img: "https://images.unsplash.com/photo-1611591475152-47e2a149023f?auto=format&fit=crop&w=160&q=80"
      },
      {
        name: "Hand-Woven Gold Tissue Zari Dupatta",
        type: "Atelier Accessory",
        price: 1200,
        img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=160&q=80"
      }
    ]
  }
];

function RoyalEnsembleLookbook({ onOpenPiece, onNegotiateLook }) {
  const [activeLook, setActiveLook] = useState(ROYAL_LOOKBOOK_PRESETS[0].id);
  const current = ROYAL_LOOKBOOK_PRESETS.find(l => l.id === activeLook) || ROYAL_LOOKBOOK_PRESETS[0];

  return (
    <section className="lookbook-section" id="lookbook">
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="tag" style={{ color: "var(--brass-bright)" }}>Curated Royal Ensembles</span>
            <h2>Shop the Complete Look —<br />harmonised by master atelier stylists.</h2>
          </div>
          <p>Explore complete head-to-toe couture compositions pairing pure handloom garments with authentic heirloom jewellery and handcrafted accessories.</p>
        </Reveal>

        <div className="lookbook-tabs-nav">
          {ROYAL_LOOKBOOK_PRESETS.map((look) => (
            <button
              key={look.id}
              className={`lookbook-tab-pill ${activeLook === look.id ? 'active' : ''}`}
              onClick={() => setActiveLook(look.id)}
            >
              {look.title}
            </button>
          ))}
        </div>

        <div className="lookbook-stage-grid">
          
          {/* Visual Model Frame */}
          <div className="lookbook-visual-frame">
            <img src={current.modelImg} alt={current.title} />
            <div className="look-tag-pill">{current.tag}</div>
          </div>

          {/* Piece Breakdown List */}
          <div className="lookbook-details-col">
            <div className="lookbook-header-box">
              <h3>{current.title}</h3>
              <p>{current.desc}</p>
            </div>

            <div className="lookbook-pieces-list">
              {current.pieces.map((p, i) => (
                <div key={i} className="lookbook-piece-item">
                  <div className="piece-item-info">
                    <img src={p.img} alt={p.name} className="piece-item-thumb" />
                    <div className="piece-item-text">
                      <h5>{p.name}</h5>
                      <span>{p.type}</span>
                    </div>
                  </div>
                  <div className="piece-item-price">${p.price.toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="lookbook-total-bar">
              <div>
                <div className="lookbook-total-label">Complete Ensemble Value</div>
                <div className="lookbook-total-val">${current.totalVal.toLocaleString()}</div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="btn-primary" 
                  style={{ padding: "12px 24px", fontSize: "12px" }}
                  onClick={() => onNegotiateLook && onNegotiateLook({
                    name: `${current.title} Full Ensemble`,
                    price: current.totalVal,
                    img: current.modelImg,
                    category: "Ensemble"
                  })}
                >
                  <Bot size={14} /> Negotiate Ensemble
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

/* =========================================================
   HERITAGE GUARANTEE & PROVENANCE STATS CARDS
   ========================================================= */
function HeritageGuaranteeStats() {
  const STATS = [
    {
      num: "100%",
      accent: " Certified",
      title: "Pure Handloom & Silk Mark",
      desc: "Every thread authenticated under lab testing — zero powerloom duplicates.",
      icon: <Award size={20} />
    },
    {
      num: "180+",
      accent: " Hours",
      title: "Artisan Loom Time",
      desc: "Woven by generational master artisans with direct ethical patronage.",
      icon: <Clock size={20} />
    },
    {
      num: "3-Tier",
      accent: " Seal",
      title: "Cryptographic Provenance",
      desc: "Physical NFC card + digital certificate issued with individual serial code.",
      icon: <ShieldCheck size={20} />
    },
    {
      num: "Global",
      accent: " VIP",
      title: "Insured White-Glove Delivery",
      desc: "Tamper-evident sealed vault box with full transit insurance worldwide.",
      icon: <Sparkles size={20} />
    }
  ];

  return (
    <section className="heritage-stats-section">
      <div className="wrap">
        <div className="heritage-stats-grid">
          {STATS.map((s, i) => (
            <div key={i} className="heritage-stat-card">
              <div className="stat-card-icon">{s.icon}</div>
              <div className="stat-card-num">
                {s.num}<em>{s.accent}</em>
              </div>
              <h4 className="stat-card-title">{s.title}</h4>
              <p className="stat-card-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   LUXURY FILTER DECK & INTERACTIVE COLLECTION CONSOLE
   ========================================================= */
function LuxuryFilterDeck({ 
  category, setCategory, 
  sizeFilter, setSizeFilter, 
  colorFilter, setColorFilter,
  categories = [] 
}) {
  const COLOR_SWATCHES = [
    { id: "All", label: "All Hues", color: "transparent" },
    { id: "Gold", label: "Amber / Gold Zari", color: "#d8b077" },
    { id: "Blue", label: "Sapphire Blue", color: "#0ea5e9" },
    { id: "Green", label: "Emerald Green", color: "#10b981" },
    { id: "Maroon", label: "Royal Maroon", color: "#be123c" },
    { id: "Midnight", label: "Midnight Black", color: "#18181b" }
  ];

  const SIZES = ["All", "S", "M", "L", "XL", "Free"];

  return (
    <div className="luxury-filter-deck">
      
      {/* Category Pills Row */}
      <div className="filter-deck-row">
        <div className="filter-deck-group">
          <span className="filter-deck-label">Collection Edit:</span>
          <div className="filter-pills-bar">
            {categories.map(cat => (
              <button
                key={cat}
                className={`deck-pill ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sizes & Color Swatches Row */}
      <div className="filter-deck-row">
        
        {/* Size Selection */}
        <div className="filter-deck-group">
          <span className="filter-deck-label">Size Gauge:</span>
          <div className="size-dial-group">
            {SIZES.map(s => (
              <button
                key={s}
                className={`size-dial-btn ${sizeFilter === s ? 'active' : ''}`}
                onClick={() => setSizeFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Color Swatches */}
        <div className="filter-deck-group">
          <span className="filter-deck-label">Material Hue:</span>
          <div className="color-swatch-group">
            {COLOR_SWATCHES.map(swatch => (
              <div
                key={swatch.id}
                className={`color-swatch-dot ${colorFilter === swatch.id ? 'active' : ''}`}
                style={{ 
                  background: swatch.color === 'transparent' ? 'var(--card)' : swatch.color,
                  border: swatch.color === 'transparent' ? '1px solid var(--hairline-strong)' : undefined
                }}
                onClick={() => setColorFilter(swatch.id)}
                title={swatch.label}
              />
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

export default function VixaraSite() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");
  const [colorFilter, setColorFilter] = useState("All");
  const [email, setEmail] = useState("");
  const [requested, setRequested] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [negotiateProduct, setNegotiateProduct] = useState(null);
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
        const withViews = data.map(p => {
          const mainImg = p.img || (p.images && p.images[0]) || "";
          let viewsList = [];
          if (Array.isArray(p.images) && p.images.length > 1) {
            viewsList = p.images.map((imgSrc, idx) => ({
              label: idx === 0 ? "Front" : idx === 1 ? "Angle" : idx === 2 ? "Detail" : `View ${idx + 1}`,
              img: imgSrc,
              zoom: idx === 2
            }));
          } else {
            viewsList = [
              { label: "Front", img: mainImg, zoom: false },
              { label: "Detail", img: mainImg, zoom: true },
              { label: "Styled", img: STYLED_SHOT, zoom: false },
            ];
          }
          return {
            ...p,
            img: mainImg,
            views: viewsList
          };
        });
        setProducts(withViews);
        setCategories(["All", ...new Set(withViews.map(p => p.category).filter(Boolean))]);
        setBrands([...new Set(withViews.map(p => p.brand).filter(Boolean))]);
      })
      .catch(err => console.error("Error fetching products:", err));
  }, []);

  const filtered = products.filter(p => {
    const matchCategory = category === "All" || p.category === category;
    const matchSize = sizeFilter === "All" || p.size === sizeFilter;
    const matchColor = colorFilter === "All" || (
      colorFilter === "Gold" ? (p.name.toLowerCase().includes("gold") || p.name.toLowerCase().includes("zari") || p.name.toLowerCase().includes("mustard")) :
      colorFilter === "Blue" ? (p.name.toLowerCase().includes("blue") || p.name.toLowerCase().includes("teal") || p.name.toLowerCase().includes("indigo")) :
      colorFilter === "Green" ? (p.name.toLowerCase().includes("olive") || p.name.toLowerCase().includes("green") || p.name.toLowerCase().includes("emerald")) :
      colorFilter === "Maroon" ? (p.name.toLowerCase().includes("maroon") || p.name.toLowerCase().includes("rose") || p.name.toLowerCase().includes("pink") || p.name.toLowerCase().includes("red")) :
      colorFilter === "Midnight" ? (p.name.toLowerCase().includes("black") || p.name.toLowerCase().includes("midnight") || p.name.toLowerCase().includes("dark")) : true
    );
    return matchCategory && matchSize && matchColor;
  });

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
            <li><Link to="/collection">Collection</Link></li>
            <li><a href="#occasions" onClick={(e) => scrollToSection('#occasions', e)}>Occasions</a></li>
            <li><a href="#anatomy" onClick={(e) => scrollToSection('#anatomy', e)}>Weaves</a></li>
            <li><a href="#lookbook" onClick={(e) => scrollToSection('#lookbook', e)}>Lookbook</a></li>
            <li><a href="#manifesto" onClick={(e) => scrollToSection('#manifesto', e)}>Provenance</a></li>
            <li><a href="#membership" onClick={(e) => scrollToSection('#membership', e)}>Access</a></li>
          </ul></nav>
          <Link to="/collection" className="nav-cta">Explore Collection</Link>
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
          <nav style={{display:"flex",flexDirection:"column",gap:24,fontSize:18,fontFamily:"'Fraunces',serif"}}>
            <Link to="/collection" onClick={() => setMenuOpen(false)}>Collection</Link>
            <a href="#occasions" onClick={(e) => scrollToSection('#occasions', e)}>Occasions</a>
            <a href="#anatomy" onClick={(e) => scrollToSection('#anatomy', e)}>Weaves Studio</a>
            <a href="#lookbook" onClick={(e) => scrollToSection('#lookbook', e)}>Lookbook</a>
            <a href="#manifesto" onClick={(e) => scrollToSection('#manifesto', e)}>Provenance</a>
            <a href="#membership" onClick={(e) => scrollToSection('#membership', e)}>Access</a>
          </nav>
        </div>
      )}

      {/* Grand Cinematic Hero Showcase (Chronoswiss-Style for Luxury Clothes & Weaves) */}
      <GrandShowcaseHero 
        products={products}
        onOpen={setSelectedProduct}
        onNegotiate={setNegotiateProduct}
      />

      {/* Live Atelier Activity & Concierge Pulse Bar */}
      <LiveAtelierPulseBar 
        onExplorePiece={(sku) => {
          const found = products.find(p => (p.sku && p.sku.includes(sku)) || p.id === sku);
          if (found) setSelectedProduct(found);
          else scrollToSection('#collection');
        }} 
      />

      {/* Atelier Craftsmanship & Provenance Story Strip */}
      <CraftsmanshipStrip 
        onExploreClick={(e) => scrollToSection('#manifesto', e)}
      />

      <div className="seam-wrap"><div className="seam"></div></div>

      {/* Occasion & Silhouette Stylist Concierge */}
      <OccasionSilhouetteMatcher 
        onOpen={setSelectedProduct}
        onNegotiate={setNegotiateProduct}
      />

      {/* Fabric & Zari Sensory Studio (The Atelier Anatomy) */}
      <AtelierFabricStudio 
        onOpenCatalog={() => scrollToSection('#collection')}
      />

      {/* Curated Royal Ensembles & Shop The Look */}
      <RoyalEnsembleLookbook 
        onOpenPiece={setSelectedProduct}
        onNegotiateLook={setNegotiateProduct}
      />

      <div className="marquee-section">
        <div className="marquee-track">
          {[...INDIAN_WEAR_TYPES, ...INDIAN_WEAR_TYPES].map((b, i) => <span key={i}>{b}</span>)}
        </div>
      </div>

      <section className="section" id="collection">
        <div className="wrap">
          <Reveal className="section-head">
            <div>
              <span className="tag">Curated Spotlight</span>
              <h2>Featured Edit —<br />nothing enters unverified.</h2>
            </div>
            <p>Filter by garment edit, size gauge, or silk hue. Click any piece for quick inspection, try-on studio &amp; AI price negotiation.</p>
          </Reveal>

          {/* Luxury Filter Deck */}
          <LuxuryFilterDeck 
            category={category}
            setCategory={setCategory}
            sizeFilter={sizeFilter}
            setSizeFilter={setSizeFilter}
            colorFilter={colorFilter}
            setColorFilter={setColorFilter}
            categories={categories}
          />

          <div className="luxury-card-grid">
            {filtered.slice(0, 6).map(p => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onOpen={setSelectedProduct} 
                isFavorite={isFavorite(p)} 
                onToggleFavorite={toggleFavorite} 
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--bone-dim)" }}>
              No pieces match your active size or hue filter. Try selecting "All".
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link to="/collection" className="btn-primary" style={{ padding: "18px 42px", fontSize: 14 }}>
              Explore Full Collection ({products.length} Pieces) <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Coming Soon & Vault Pipeline Section */}
      <section className="section coming-soon-showcase" id="upcoming">
        <div className="wrap">
          <Reveal className="section-head">
            <div>
              <span className="tag" style={{ color: "var(--brass-bright)" }}>Upcoming Drops &amp; Pipeline</span>
              <h2>Coming Soon Vault —<br />reserve before public release.</h2>
            </div>
            <p>Admin-curated upcoming stock, private previews, and restocking capsules. Click any item to negotiate or secure VIP pre-orders.</p>
          </Reveal>
        </div>
        <div className="grid wrap">
          {(products.filter(p => p.status === "Coming Soon" || p.status === "Coming Back").length > 0
            ? products.filter(p => p.status === "Coming Soon" || p.status === "Coming Back")
            : products.slice(0, 3).map(p => ({ ...p, status: "Coming Soon", drop_date: "Next Capsule Drop" }))
          ).slice(0, 3).map(p => (
            <ProductCard key={p.id} product={p} onOpen={setSelectedProduct} isFavorite={isFavorite(p)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <Link to="/collection" className="btn-ghost" style={{ padding: "14px 34px", fontSize: 13 }}>
            View Full Vault &amp; Restock Pieces <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Heritage Guarantee & Provenance Stats Cards */}
      <HeritageGuaranteeStats />

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} isFavorite={selectedProduct ? isFavorite(selectedProduct) : false} onToggleFavorite={toggleFavorite} />
      {negotiateProduct && (
        <AINegotiationModal product={negotiateProduct} onClose={() => setNegotiateProduct(null)} />
      )}
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
