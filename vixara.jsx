import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShieldCheck, Menu, X, ArrowRight, ChevronLeft, ChevronRight,
  Upload, RefreshCw, Shirt, Sparkles, Trash2
} from "lucide-react";

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
const PRODUCTS = [
  { id: "VX-0417", brand: "Loro Piana", name: "Cashmere Overcoat", price: 3240, size: "M", category: "Outerwear",
    img: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=60" },
  { id: "VX-0552", brand: "Margiela", name: "Deconstructed Blazer", price: 1890, size: "48", category: "Tailoring",
    img: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=800&q=60" },
  { id: "VX-0603", brand: "Bottega Veneta", name: "Intrecciato Jacket", price: 2410, size: "L", category: "Outerwear",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=60" },
  { id: "VX-0689", brand: "Brunello Cucinelli", name: "Wool Knit Sweater", price: 1120, size: "S", category: "Knitwear",
    img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=60" },
  { id: "VX-0714", brand: "Saint Laurent", name: "Silk Shirt", price: 980, size: "40", category: "Tailoring",
    img: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=800&q=60" },
  { id: "VX-0771", brand: "Balenciaga", name: "Tailored Trousers", price: 1340, size: "32", category: "Tailoring",
    img: "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=800&q=60" },
].map(p => ({
  ...p,
  views: [
    { label: "Front", img: p.img, zoom: false },
    { label: "Detail", img: p.img, zoom: true },
    { label: "Styled", img: STYLED_SHOT, zoom: false },
  ],
}));

const CATEGORIES = ["All", "Outerwear", "Tailoring", "Knitwear"];
const BRANDS = [...new Set(PRODUCTS.map(p => p.brand))];

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

function ProductCard({ product, onOpen }) {
  return (
    <div className="piece" onClick={() => onOpen(product)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(product); }}>
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

function ProductModal({ product, onClose }) {
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
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Reserve This Piece <ArrowRight size={15} />
          </button>
        </div>
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = category === "All" ? PRODUCTS : PRODUCTS.filter(p => p.category === category);

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Manrope:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .vx-root{
          --ink:#0b0b0c; --ink-2:#141416; --card:#17171a;
          --bone:#f0ede6; --bone-dim:#c9c5ba;
          --brass:#b6905a; --brass-bright:#d8b077;
          --hairline:rgba(240,237,230,0.12); --hairline-strong:rgba(240,237,230,0.22);
          background:var(--ink); color:var(--bone);
          font-family:'Manrope',sans-serif;
          -webkit-font-smoothing:antialiased;
          width:100%; overflow-x:hidden;
        }
        .vx-root *{box-sizing:border-box;}
        .vx-root a{color:inherit;text-decoration:none;}
        .vx-root ::selection{background:var(--brass);color:var(--ink);}
        .display{font-family:'Fraunces',serif;}
        .mono{font-family:'IBM Plex Mono',monospace;letter-spacing:0.06em;}
        .wrap{max-width:1280px;margin:0 auto;padding:0 48px;}
        @media(max-width:720px){.wrap{padding:0 22px;}}
        button, .btn{cursor:pointer;border:none;background:none;font-family:inherit;color:inherit;}
        a:focus-visible, button:focus-visible{outline:2px solid var(--brass-bright);outline-offset:3px;}

        header{
          position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;
          padding:26px 48px; background:linear-gradient(to bottom, rgba(11,11,12,0.92), rgba(11,11,12,0.75));
          transition:background .4s ease, padding .4s ease, border-color .4s ease; border-bottom:1px solid transparent;
          backdrop-filter:blur(10px);
        }
        header.scrolled{padding:16px 48px;border-bottom:1px solid var(--hairline);background:rgba(11,11,12,0.9);}
        @media(max-width:720px){header,header.scrolled{padding:18px 22px;}}
        .logo{font-family:'Fraunces',serif;font-weight:500;font-size:22px;letter-spacing:0.08em;}
        .logo em{font-style:italic;color:var(--brass-bright);}
        nav ul{display:flex;gap:38px;list-style:none;margin:0;padding:0;}
        nav a{font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:var(--bone-dim);transition:color .25s;}
        nav a:hover{color:var(--bone);}
        .nav-cta{border:1px solid var(--hairline-strong);padding:10px 22px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;transition:all .3s ease;}
        .nav-cta:hover{background:var(--brass);border-color:var(--brass);color:var(--ink);}
        .nav-links{display:flex;align-items:center;gap:38px;}
        .menu-btn{display:none;align-items:center;justify-content:center;}
        @media(max-width:860px){.nav-links{display:none;}.menu-btn{display:flex;}}

        .hero{position:relative;min-height:92vh;display:flex;flex-direction:column;justify-content:flex-end;padding:100px 48px 0;overflow:hidden;}
        @media(max-width:720px){.hero{padding:70px 22px 0;}}
        .hero-bg{
          position:absolute;inset:0;
          background:
            linear-gradient(180deg, rgba(11,11,12,0.15) 0%, rgba(11,11,12,0.55) 55%, var(--ink) 96%),
            url('https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=1600&q=60');
          background-size:cover;background-position:center 20%;filter:grayscale(35%) contrast(1.05);
        }
        .hero-inner{position:relative;z-index:2;padding-bottom:70px;}
        .eyebrow{display:flex;align-items:center;gap:14px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:var(--brass-bright);margin-bottom:24px;}
        .eyebrow::before{content:'';width:34px;height:1px;background:var(--brass-bright);}
        .hero h1{font-size:clamp(44px, 8vw, 118px);font-weight:400;line-height:0.92;letter-spacing:-0.01em;}
        .hero h1 .accent{font-style:italic;font-weight:300;color:var(--brass-bright);}
        .hero-sub{display:flex;justify-content:space-between;align-items:flex-end;margin-top:36px;padding-top:32px;border-top:1px solid var(--hairline);gap:36px;flex-wrap:wrap;}
        .hero-sub p{max-width:420px;font-size:16px;line-height:1.7;color:var(--bone-dim);font-weight:300;}
        .hero-actions{display:flex;gap:16px;flex-shrink:0;}
        .btn-primary{background:var(--brass);color:var(--ink);padding:16px 34px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;transition:transform .3s ease, background .3s ease;display:inline-flex;align-items:center;gap:8px;}
        .btn-primary:hover{background:var(--brass-bright);transform:translateY(-2px);}
        .btn-ghost{border:1px solid var(--hairline-strong);padding:16px 34px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;transition:border-color .3s ease;}
        .btn-ghost:hover{border-color:var(--bone);}

        .seam-wrap{padding:0 48px;} @media(max-width:720px){.seam-wrap{padding:0 22px;}}
        .seam{height:1px;width:100%;background:repeating-linear-gradient(90deg, var(--brass) 0 10px, transparent 10px 20px);opacity:0.55;}

        .marquee-section{padding:22px 0;border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline);overflow:hidden;background:var(--ink-2);}
        .marquee-track{display:flex;width:max-content;animation:vxscroll 30s linear infinite;}
        .marquee-track span{font-family:'Fraunces',serif;font-style:italic;font-size:22px;color:var(--bone-dim);padding:0 40px;white-space:nowrap;display:flex;align-items:center;gap:40px;}
        .marquee-track span::after{content:'◆';font-size:9px;color:var(--brass);font-style:normal;}
        @keyframes vxscroll{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        @media (prefers-reduced-motion: reduce){.marquee-track{animation:none;}}

        .section{padding:110px 0;} @media(max-width:720px){.section{padding:70px 0;}}
        .section-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:48px;gap:30px;flex-wrap:wrap;padding-bottom:26px;border-bottom:1px solid var(--hairline);}
        .section-head .tag{font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:var(--brass-bright);margin-bottom:14px;display:block;}
        .section-head h2{font-family:'Fraunces',serif;font-weight:400;font-size:clamp(28px,4vw,46px);max-width:600px;margin:0;}
        .section-head p{max-width:320px;color:var(--bone-dim);font-size:15px;line-height:1.7;font-weight:300;}

        .filters{display:flex;gap:10px;margin-bottom:36px;flex-wrap:wrap;}
        .filter-btn{border:1px solid var(--hairline-strong);padding:9px 20px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;transition:all .25s ease;}
        .filter-btn:hover{border-color:var(--bone);}
        .filter-btn.active{background:var(--brass);border-color:var(--brass);color:var(--ink);}

        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:var(--hairline);}
        @media(max-width:900px){.grid{grid-template-columns:1fr;}}
        .piece{position:relative;background:var(--card);aspect-ratio:3/4;overflow:hidden;cursor:pointer;}
        .quick-view-tag{
          position:absolute;left:18px;top:18px;background:var(--brass);color:var(--ink);
          font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;
          padding:8px 16px;opacity:0;transform:translateY(-8px);transition:opacity .3s ease, transform .3s ease;
        }
        .piece:hover .quick-view-tag{opacity:1;transform:translateY(0);}
        .piece img{width:100%;height:100%;object-fit:cover;filter:grayscale(20%) brightness(0.82);transition:transform .7s cubic-bezier(.2,.8,.2,1), filter .5s ease;}
        .piece:hover img{transform:scale(1.06);filter:grayscale(0%) brightness(0.95);}
        .piece-info{position:absolute;left:0;right:0;bottom:0;padding:24px;background:linear-gradient(to top, rgba(11,11,12,0.92), transparent 80%);}
        .piece-brand{font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--brass-bright);margin-bottom:6px;}
        .piece-name{font-family:'Fraunces',serif;font-size:21px;font-weight:400;margin-bottom:8px;}
        .piece-price{font-size:14px;color:var(--bone-dim);}
        .seal{position:absolute;top:18px;right:18px;width:64px;height:64px;border-radius:50%;border:1px solid var(--brass-bright);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:rgba(11,11,12,0.6);backdrop-filter:blur(4px);color:var(--brass-bright);opacity:0;transform:scale(0.8) rotate(-8deg);transition:opacity .4s ease, transform .4s ease;}
        .piece:hover .seal{opacity:1;transform:scale(1) rotate(0deg);}
        .seal-text{font-family:'IBM Plex Mono',monospace;font-size:7px;text-align:center;letter-spacing:0.05em;line-height:1.3;}

        .manifesto{display:grid;grid-template-columns:0.9fr 1.1fr;gap:70px;align-items:center;}
        @media(max-width:900px){.manifesto{grid-template-columns:1fr;gap:36px;}}
        .manifesto-img{position:relative;aspect-ratio:4/5;overflow:hidden;}
        .manifesto-img img{width:100%;height:100%;object-fit:cover;filter:grayscale(30%) brightness(0.85);}
        .manifesto-quote{font-family:'Fraunces',serif;font-style:italic;font-size:clamp(22px,2.4vw,32px);line-height:1.4;margin:0;}
        .manifesto-quote .brass{color:var(--brass-bright);}
        .manifesto-cite{margin-top:24px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:var(--bone-dim);}
        .manifesto-body{margin-top:26px;font-size:15px;line-height:1.8;color:var(--bone-dim);font-weight:300;max-width:480px;}

        .provenance{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--hairline);border:1px solid var(--hairline);}
        @media(max-width:900px){.provenance{grid-template-columns:1fr;}}
        .prov-item{background:var(--ink);padding:40px 34px;}
        .prov-code{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--brass-bright);margin-bottom:18px;display:block;}
        .prov-item h3{font-family:'Fraunces',serif;font-size:22px;font-weight:400;margin:0 0 12px;}
        .prov-item p{font-size:14.5px;line-height:1.75;color:var(--bone-dim);font-weight:300;margin:0;}

        .membership{position:relative;padding:100px 0;text-align:center;background:radial-gradient(ellipse at center, var(--ink-2) 0%, var(--ink) 70%);border-top:1px solid var(--hairline);border-bottom:1px solid var(--hairline);}
        .membership .tag{font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:var(--brass-bright);margin-bottom:20px;display:block;}
        .membership h2{font-family:'Fraunces',serif;font-weight:400;font-size:clamp(30px,5vw,58px);max-width:760px;margin:0 auto 30px;line-height:1.15;}
        .membership h2 em{font-style:italic;color:var(--brass-bright);}
        .membership-form{display:flex;justify-content:center;max-width:440px;margin:0 auto;border:1px solid var(--hairline-strong);}
        .membership-form input{flex:1;background:transparent;border:none;padding:18px 20px;color:var(--bone);font-family:'Manrope',sans-serif;font-size:14px;}
        .membership-form input::placeholder{color:var(--bone-dim);}
        .membership-form button{background:var(--brass);color:var(--ink);padding:18px 26px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;transition:background .3s ease;white-space:nowrap;}
        .membership-form button:hover{background:var(--brass-bright);}
        .membership-note{margin-top:16px;font-size:13px;color:var(--brass-bright);}

        footer{padding:60px 0 36px;}
        .footer-top{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:36px;padding-bottom:48px;border-bottom:1px solid var(--hairline);}
        @media(max-width:760px){.footer-top{grid-template-columns:1fr 1fr;}}
        .footer-brand p{font-size:14px;color:var(--bone-dim);font-weight:300;max-width:260px;line-height:1.7;margin-top:14px;}
        .footer-col h4{font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:var(--brass-bright);margin-bottom:18px;}
        .footer-col ul{list-style:none;margin:0;padding:0;}
        .footer-col li{margin-bottom:11px;}
        .footer-col a{font-size:14px;color:var(--bone-dim);transition:color .25s;}
        .footer-col a:hover{color:var(--bone);}
        .footer-bottom{display:flex;justify-content:space-between;padding-top:26px;flex-wrap:wrap;gap:12px;font-size:12px;color:var(--bone-dim);}

        /* ---------- product quick-view modal ---------- */
        .modal-backdrop{
          position:fixed;inset:0;z-index:300;background:rgba(11,11,12,0.85);backdrop-filter:blur(6px);
          display:flex;align-items:center;justify-content:center;padding:24px;
        }
        .modal{
          position:relative;background:var(--ink-2);border:1px solid var(--hairline-strong);
          width:100%;max-width:960px;max-height:90vh;overflow:auto;
          display:grid;grid-template-columns:1.2fr 1fr;
        }
        @media(max-width:800px){.modal{grid-template-columns:1fr;}}
        .modal-close{
          position:absolute;top:16px;right:16px;z-index:5;width:38px;height:38px;border-radius:50%;
          background:rgba(11,11,12,0.6);border:1px solid var(--hairline-strong);
          display:flex;align-items:center;justify-content:center;color:var(--bone);
        }
        .modal-close:hover{border-color:var(--bone);}
        .modal-media{background:var(--card);padding:26px;display:flex;flex-direction:column;gap:16px;}
        .modal-image-wrap{position:relative;aspect-ratio:4/5;overflow:hidden;background:var(--ink);}
        .modal-image-wrap img{width:100%;height:100%;object-fit:cover;filter:grayscale(15%) brightness(0.9);}
        .modal-image-wrap img.zoomed{transform:scale(1.7);}
        .view-label{position:absolute;left:16px;bottom:16px;background:rgba(11,11,12,0.7);color:var(--brass-bright);padding:6px 12px;font-size:11px;}
        .gallery-nav{
          position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;
          background:rgba(11,11,12,0.55);border:1px solid var(--hairline-strong);color:var(--bone);
          display:flex;align-items:center;justify-content:center;
        }
        .gallery-nav:hover{background:rgba(11,11,12,0.85);}
        .gallery-nav.prev{left:14px;} .gallery-nav.next{right:14px;}
        .thumbs{display:flex;gap:10px;}
        .thumb{flex:1;border:1px solid var(--hairline);background:none;padding:0;overflow:hidden;display:flex;flex-direction:column;}
        .thumb.active{border-color:var(--brass-bright);}
        .thumb img{width:100%;aspect-ratio:1/1;object-fit:cover;filter:grayscale(20%) brightness(0.85);}
        .thumb img.zoomed{transform:scale(1.7);}
        .thumb span{font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--bone-dim);padding:6px 0;text-align:center;}
        .modal-info{padding:38px 34px;display:flex;flex-direction:column;}
        .modal-tabs{display:flex;gap:8px;margin-bottom:22px;}
        .modal-tabs button{
          flex:1;border:1px solid var(--hairline-strong);padding:10px 12px;font-size:12px;letter-spacing:0.06em;
          text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .25s ease;
        }
        .modal-tabs button.active{background:var(--brass);border-color:var(--brass);color:var(--ink);}
        .modal-info h3{font-size:26px;font-weight:400;margin:4px 0 10px;}
        .modal-price{font-size:15px;color:var(--bone-dim);margin-bottom:16px;}
        .modal-seal{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--brass-bright);border:1px solid var(--hairline);padding:10px 14px;margin-bottom:20px;}
        .modal-desc{font-size:14px;line-height:1.75;color:var(--bone-dim);font-weight:300;margin-bottom:26px;}

        /* ---------- try-on studio ---------- */
        .tryon{display:flex;flex-direction:column;gap:16px;flex:1;}
        .dropzone{
          flex:1;min-height:340px;border:1px dashed var(--hairline-strong);display:flex;flex-direction:column;
          align-items:center;justify-content:center;gap:10px;cursor:pointer;color:var(--bone-dim);text-align:center;padding:20px;
          transition:border-color .25s ease, color .25s ease;
        }
        .dropzone:hover{border-color:var(--brass-bright);color:var(--bone);}
        .dropzone-sub{font-size:11.5px;max-width:220px;color:var(--bone-dim);}
        .tryon-stage{position:relative;aspect-ratio:4/5;overflow:hidden;background:var(--ink);touch-action:none;}
        .tryon-photo{width:100%;height:100%;object-fit:cover;}
        .tryon-garment{
          position:absolute;left:50%;top:50%;width:62%;cursor:grab;user-select:none;
          filter:drop-shadow(0 12px 20px rgba(0,0,0,0.5));
        }
        .tryon-garment:active{cursor:grabbing;}
        .tryon-controls{display:flex;flex-direction:column;gap:10px;}
        .tryon-controls label{display:flex;align-items:center;gap:12px;font-size:12px;letter-spacing:0.05em;text-transform:uppercase;color:var(--bone-dim);}
        .tryon-controls input[type="range"]{flex:1;accent-color:var(--brass);}
        .tryon-actions{display:flex;gap:8px;flex-wrap:wrap;}
        .btn-ghost.small{padding:9px 14px;font-size:11px;display:inline-flex;align-items:center;gap:6px;}
        .as-label{cursor:pointer;}
        .tryon-note{display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.6;color:var(--bone-dim);}
        .tryon-note svg{flex-shrink:0;margin-top:2px;color:var(--brass-bright);}

        .reveal{opacity:0;transform:translateY(22px);transition:opacity .8s ease, transform .8s ease;}
        .reveal.in{opacity:1;transform:translateY(0);}
      `}</style>

      <header className={scrolled ? "scrolled" : ""}>
        <div className="logo">VIX<em>ARA</em></div>
        <div className="nav-links">
          <nav><ul>
            <li><a href="#collection" onClick={(e) => scrollToSection('#collection', e)}>Collection</a></li>
            <li><a href="#manifesto" onClick={(e) => scrollToSection('#manifesto', e)}>Provenance</a></li>
            <li><a href="#membership" onClick={(e) => scrollToSection('#membership', e)}>Access</a></li>
          </ul></nav>
          <a href="#membership" className="nav-cta" onClick={(e) => scrollToSection('#membership', e)}>Request Access</a>
        </div>
        <button className="menu-btn" aria-label="Toggle menu" onClick={() => setMenuOpen(m => !m)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
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
          {[...BRANDS, ...BRANDS].map((b, i) => <span key={i}>{b}</span>)}
        </div>
      </div>

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
            {CATEGORIES.map(c => (
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
          {filtered.map(p => <ProductCard key={p.id} product={p} onOpen={setSelectedProduct} />)}
        </div>
      </section>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
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
