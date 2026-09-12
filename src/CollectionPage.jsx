import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Heart, ArrowRight, ChevronLeft, ChevronRight, X,
  MessageSquare, ThumbsDown, CheckCircle2, Copy, Zap, Search, Menu,
  Bot, Clock, Sparkles, ShieldAlert, Send
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://vixara-backend.onrender.com";
const STYLED_SHOT = "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=70";

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
      text: `Hello! I am Vixara's AI Valuation & Price Negotiation Agent. Provenance confirmed for "${product.name}" (${product.brand}). Catalog valuation is ₹${originalPrice.toLocaleString()}. What counter-offer would you like to propose?`
    }
  ]);

  const discountPercent = Math.round(((originalPrice - proposedPrice) / originalPrice) * 100);

  const handleSendOffer = async () => {
    if (loading || proposedPrice <= 0) return;
    setLoading(true);

    const userMsg = {
      sender: "user",
      text: `I would like to offer ₹${proposedPrice.toLocaleString()} (${discountPercent}% off valuation).`
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
      const floor = Math.round(originalPrice * 0.80);
      if (proposedPrice >= floor) {
        const promoCode = `AI-VIP-${discountPercent}-${Math.floor(100 + Math.random() * 900)}`;
        const acceptedData = {
          decision: "ACCEPTED",
          agreedPrice: proposedPrice,
          discountPercent,
          promoCode,
          message: `✨ Deal Approved! Our AI Agent has matched your offer at ₹${proposedPrice.toLocaleString()} (${discountPercent}% discount).`
        };
        setDeal(acceptedData);
        setMessages(prev => [...prev, { sender: "bot", text: acceptedData.message }]);
      } else {
        const counterPrice = Math.round(originalPrice * 0.85);
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: `🤖 Vixara AI Agent: "We cannot approve ₹${proposedPrice.toLocaleString()}, but I can authorize an exclusive private collector rate of ₹${counterPrice.toLocaleString()} (15% off)."`
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
                <div className="offer-price-tag">₹{proposedPrice.toLocaleString()}</div>
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
            <h4 className="display" style={{ fontSize: 20, margin: "0 0 6px" }}>Agreement Reached: ₹{deal.agreedPrice.toLocaleString()}</h4>
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

export default function CollectionPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Interested Modal State
  const [interestedOpen, setInterestedOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState("M");
  const [channel, setChannel] = useState("WhatsApp");
  const [contactInput, setContactInput] = useState("");
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
            status: p.status || "Available",
            img: mainImg,
            views: viewsList
          };
        });
        setProducts(withViews);
        setCategories(["All", ...new Set(withViews.map(p => p.category).filter(Boolean))]);
      })
      .catch(err => console.error("Error fetching products:", err));
  }, []);

  const filtered = products.filter(p => {
    const matchesCategory = category === "All" || p.category === category;
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const toggleFavorite = useCallback((product) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      return exists ? prev.filter((item) => item.id !== product.id) : [...prev, product];
    });
  }, []);

  const isFavorite = useCallback((product) => favorites.some((item) => item.id === product.id), [favorites]);

  const handleInterestedSubmit = (e) => {
    e.preventDefault();
    if (!contactInput) return;
    const isEmail = channel === "Email";
    const contactIsValid = isEmail
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInput)
      : /^\d{10,15}$/.test(contactInput);
    if (!contactIsValid) return;
    fetch(`${API_URL}/api/interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact: contactInput, size: selectedSize, commsPreference: channel, price: selectedProduct?.price, productId: selectedProduct?.id })
    }).catch(err => console.error(err));
    setInterestedSubmitted(true);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: `${reason}${notes ? ` - ${notes}` : ""}`, productId: selectedProduct?.id })
    }).catch(err => console.error(err));
    setFeedbackSubmitted(true);
  };

  const copyDiscount = () => {
    navigator.clipboard.writeText("STHREE-VIP-15");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="vx-root">
      <header className="scrolled">
        <Link to="/" className="logo">VIX<em>ARA</em></Link>
        <div className="nav-links">
          <nav>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/collection" style={{ color: "var(--brass-bright)" }}>Collection</Link></li>
            </ul>
          </nav>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setFavoritesOpen(true)}>
            <Heart size={20} strokeWidth={1.6} fill={favorites.length ? "currentColor" : "none"} />
            {favorites.length > 0 && <span className="icon-badge">{favorites.length}</span>}
          </button>
          <button className="menu-btn" onClick={() => setMenuOpen(m => !m)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--ink)", display: "flex", flexDirection: "column", padding: "90px 28px 28px" }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: 28, fontSize: 20, fontFamily: "'Fraunces',serif" }}>
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/collection" onClick={() => setMenuOpen(false)} style={{ color: "var(--brass-bright)" }}>Collection</Link>
          </nav>
        </div>
      )}

      <section className="section" style={{ paddingTop: 130 }}>
        <div className="wrap">
          <div className="section-head" style={{ border: "none", marginBottom: 20 }}>
            <div>
              <span className="tag">Full Collection &amp; Vault</span>
              <h2>STHREE / Vixara Catalog</h2>
            </div>
            <p>Explore all {products.length} authenticated Indian Wear pieces, active stock &amp; upcoming drops.</p>
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { id: "All", label: "All Items" },
              { id: "Available", label: "In Stock" },
              { id: "Coming Soon", label: "Coming Soon Vault" },
              { id: "Coming Back", label: "Restocking Soon" },
              { id: "Out of Stock", label: "Archived" }
            ].map(tab => (
              <button
                key={tab.id}
                className={`filter-btn ${statusFilter === tab.id ? "active" : ""}`}
                onClick={() => setStatusFilter(tab.id)}
                style={{ fontSize: 11, padding: "6px 14px" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category & Search Filter Bar */}
          <div style={{ display: "flex", gap: 16, marginBottom: 30, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div className="filters" style={{ marginBottom: 0 }}>
              {categories.map(c => (
                <button key={c} className={`filter-btn ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>

            <div style={{ position: "relative", width: 280 }}>
              <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--bone-dim)" }} />
              <input
                type="text"
                placeholder="Search collection..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="custom-input"
                style={{ paddingLeft: 40, padding: "10px 14px 10px 40px", fontSize: 13 }}
              />
            </div>
          </div>
        </div>

        <div className="grid wrap">
          {filtered.map(p => {
            const hasStatus = p.status && p.status !== "Available";
            return (
              <div key={p.id} className="piece" onClick={() => { setSelectedProduct(p); setInterestedSubmitted(false); setFeedbackSubmitted(false); }}>
                {/* Dynamic Status Tag */}
                {p.status === "Coming Soon" && (
                  <div className="product-status-tag status-coming-soon">
                    <Clock size={11} /> Coming Soon
                  </div>
                )}
                {p.status === "Coming Back" && (
                  <div className="product-status-tag status-coming-back">
                    <Sparkles size={11} /> Restocking
                  </div>
                )}
                {p.status === "Out of Stock" && (
                  <div className="product-status-tag status-out-of-stock">
                    <ShieldAlert size={11} /> Sold Out
                  </div>
                )}

                <button
                  className={`favorite-pill ${isFavorite(p) ? "active" : ""} ${hasStatus ? "has-status" : ""}`}
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(p); }}
                >
                  <Heart size={14} strokeWidth={1.8} fill={isFavorite(p) ? "currentColor" : "none"} />
                </button>
                <img src={p.img} alt={p.name} />
                <div className="seal">
                  <ShieldCheck size={16} strokeWidth={1.5} />
                  <div className="seal-text">VERIFIED<br />AUTHENTIC<br />{p.id}</div>
                </div>
                <div className="piece-info">
                  <div className="piece-brand">{p.brand}</div>
                  <div className="piece-name">{p.name}</div>
                  <div className="piece-price">
                    ₹{p.price.toLocaleString()} · Size {p.size}
                    {p.drop_date && (
                      <span style={{ display: "block", fontSize: 11, color: "var(--brass-bright)", marginTop: 2 }}>
                        🗓 {p.drop_date}
                      </span>
                    )}
                  </div>
                </div>
                <div className="quick-view-tag">Quick View</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Negotiation Concierge Modal */}
      {negotiateOpen && selectedProduct && (
        <AINegotiationModal product={selectedProduct} onClose={() => setNegotiateOpen(false)} />
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}><X size={20} /></button>
            <div className="modal-media">
              <div className="modal-image-wrap">
                <img src={selectedProduct.img} alt={selectedProduct.name} />
                <span className="view-label mono">Front View</span>
              </div>
            </div>
            <div className="modal-info">
              <div className="piece-brand">{selectedProduct.brand}</div>
              <h3 className="display">{selectedProduct.name}</h3>
              <div className="modal-price">₹{selectedProduct.price.toLocaleString()} · Size {selectedProduct.size}</div>

              {selectedProduct.status && selectedProduct.status !== "Available" && (
                <div style={{ marginBottom: 12 }}>
                  <span className={`product-status-tag ${selectedProduct.status === "Coming Soon" ? "status-coming-soon" : selectedProduct.status === "Coming Back" ? "status-coming-back" : "status-out-of-stock"}`} style={{ position: "static", display: "inline-flex" }}>
                    {selectedProduct.status} {selectedProduct.drop_date ? `· ${selectedProduct.drop_date}` : ""}
                  </span>
                </div>
              )}

              <div className="modal-seal mono">
                <ShieldCheck size={14} /> VERIFIED AUTHENTIC — {selectedProduct.id}
              </div>
              <p className="modal-desc">Inspected under Vixara's three-point standard. Ships with numbered authentication card.</p>
              
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

              <button className={`btn-ghost small ${isFavorite(selectedProduct) ? "active-favorite" : ""}`} style={{ width: "100%", justifyContent: "center" }} onClick={() => toggleFavorite(selectedProduct)}>
                <Heart size={14} strokeWidth={1.8} fill={isFavorite(selectedProduct) ? "currentColor" : "none"} /> {isFavorite(selectedProduct) ? "Saved to Favorites" : "Add to Favorites"}
              </button>
            </div>
          </div>

          {/* Interested Modal with Smart Choice Tooltip & Channel Assistance */}
          {interestedOpen && (
            <div className="modal-backdrop" onClick={() => setInterestedOpen(false)} style={{ zIndex: 1100 }}>
              <div className="modal-card-custom" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setInterestedOpen(false)}><X size={18} /></button>
                {!interestedSubmitted ? (
                  <form onSubmit={handleInterestedSubmit}>
                    <div className="chat-modal-head">
                      <h3 className="display">STHREE VIP Concierge</h3>
                      <p>Reserve size &amp; unlock an exclusive 15% VIP discount.</p>
                    </div>

                    {/* Popular Choice Proactive Tooltip */}
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

                      {/* Channel Intelligence Help Box */}
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
                      <label>{channel === "Email" ? "Your Email Address" : "Your Phone Number"}</label>
                      <input
                        type={channel === "Email" ? "email" : "tel"}
                        inputMode={channel === "Email" ? "email" : "numeric"}
                        pattern={channel === "Email" ? "[^\\s@]+@[^\\s@]+\\.[^\\s@]+" : "\\d{10,15}"}
                        required
                        placeholder={channel === "Email" ? "name@domain.com" : "+91 98765 43210"}
                        value={contactInput}
                        onChange={e => setContactInput(e.target.value)}
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

          {/* Not Interested Modal */}
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
      )}

      {/* Favorites Drawer */}
      {favoritesOpen && (
        <div className="favorites-backdrop open" onClick={() => setFavoritesOpen(false)}>
          <div className="favorites-drawer open" onClick={(e) => e.stopPropagation()}>
            <div className="favorites-head">
              <h3 className="display">Favorites</h3>
              <button className="modal-close static" onClick={() => setFavoritesOpen(false)}><X size={18} /></button>
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
                      <div className="piece-price">₹{product.price.toLocaleString()} · Size {product.size}</div>
                    </div>
                    <button className="cart-remove" onClick={() => toggleFavorite(product)}>
                      <Heart size={15} strokeWidth={1.8} fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
