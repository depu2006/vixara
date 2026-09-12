import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Menu, X, ArrowRight, ChevronLeft, ChevronRight,
  Upload, RefreshCw, Shirt, Sparkles, Trash2, Heart, MessageSquare,
  ThumbsDown, CheckCircle2, Copy, Zap, Bot, Clock, Flame, ShieldAlert,
  Send, CornerDownRight, Check
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
  const hasStatus = product.status && product.status !== "Available";

  return (
    <div className="piece" onClick={() => onOpen(product)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(product); }}>
      
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
      <div className="piece-info">
        <div className="piece-brand">{product.brand}</div>
        <div className="piece-name">{product.name}</div>
        <div className="piece-price">
          ${product.price.toLocaleString()} · Size {product.size}
          {product.drop_date && (
            <span style={{ display: "block", fontSize: 11, color: "var(--brass-bright)", marginTop: 2 }}>
              🗓 {product.drop_date}
            </span>
          )}
        </div>
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
            <li><Link to="/collection">Collection</Link></li>
            <li><a href="#manifesto" onClick={(e) => scrollToSection('#manifesto', e)}>Provenance</a></li>
            <li><a href="#membership" onClick={(e) => scrollToSection('#membership', e)}>Access</a></li>
            <li><Link to="/admin">Admin</Link></li>
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
          <nav style={{display:"flex",flexDirection:"column",gap:28,fontSize:20,fontFamily:"'Fraunces',serif"}}>
            <Link to="/collection" onClick={() => setMenuOpen(false)}>Collection</Link>
            <a href="#manifesto" onClick={(e) => scrollToSection('#manifesto', e)}>Provenance</a>
            <a href="#membership" onClick={(e) => scrollToSection('#membership', e)}>Access</a>
            <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
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
              <Link to="/collection" className="btn-primary">Enter the Collection <ArrowRight size={15} /></Link>
              <a href="#manifesto" className="btn-ghost" onClick={(e) => scrollToSection('#manifesto', e)}>Our Standard</a>
            </div>
          </div>
        </div>
      </section>

      <div className="seam-wrap"><div className="seam"></div></div>

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
            <p>Click any piece for quick view, try-on studio &amp; VIP reservations.</p>
          </Reveal>
        </div>
        <div className="grid">
          {products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} onOpen={setSelectedProduct} isFavorite={isFavorite(p)} onToggleFavorite={toggleFavorite} />)}
        </div>
        <div style={{ textAlign: "center", marginTop: 44 }}>
          <Link to="/collection" className="btn-primary" style={{ padding: "18px 42px", fontSize: 14 }}>
            Explore Full Collection ({products.length} Pieces) <ArrowRight size={16} />
          </Link>
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
