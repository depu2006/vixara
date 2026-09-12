import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, LogOut, CheckCircle, AlertCircle, Users, MessageSquare, Clock, Sparkles, ShieldAlert, Rocket, Sliders, Zap, Check, Upload, X, Image as ImageIcon } from 'lucide-react';
import { launchProductWithPrice, calculateLaunchPricing } from '../backend/shopify-backend-launch.js';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://vixara-backend.onrender.com';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('products');
  const [priceInput, setPriceInput] = useState(3240);
  const [discountPercent, setDiscountPercent] = useState(15);
  const [launchResult, setLaunchResult] = useState(null);
  
  const [products, setProducts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [feedback, setFeedback] = useState([]);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '', brand: '', name: '', price: '', size: '', category: '', img: '', images: [], status: 'Available', drop_date: ''
  });

  const fetchData = async () => {
    try {
      const pRes = await fetch(`${API_URL}/api/products`);
      const pData = await pRes.json();
      setProducts(pData);
      
      const headers = { 'Authorization': `Bearer ${token}` };
      const lRes = await fetch(`${API_URL}/api/leads`, { headers });
      if (lRes.ok) setLeads(await lRes.json());
      
      const fRes = await fetch(`${API_URL}/api/feedback`, { headers });
      if (fRes.ok) setFeedback(await fRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        setToken(data.token);
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Image Upload Handlers (JPEG / PNG / WEBP - Single or Multi)
  const handleImageFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      alert('Please select JPEG or PNG image files.');
      return;
    }

    const readers = fileList.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(newImages => {
      setFormData(prev => {
        const updated = [...(prev.images || []), ...newImages];
        return {
          ...prev,
          images: updated,
          img: updated[0] || prev.img
        };
      });
    });
  };

  const removeImage = (idxToRemove) => {
    setFormData(prev => {
      const updated = (prev.images || []).filter((_, idx) => idx !== idxToRemove);
      return {
        ...prev,
        images: updated,
        img: updated[0] || ''
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!formData.images || formData.images.length === 0) && !formData.img) {
      alert('Please upload at least one JPEG or PNG image for this product.');
      return;
    }

    const primaryImg = (formData.images && formData.images.length > 0) ? formData.images[0] : formData.img;
    const imagesArray = (formData.images && formData.images.length > 0) ? formData.images : (primaryImg ? [primaryImg] : []);
    
    const payload = {
      ...formData,
      img: primaryImg,
      images: imagesArray
    };

    const url = isEditing ? `${API_URL}/api/products/${formData.id}` : `${API_URL}/api/products`;
    const method = isEditing ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowForm(false);
        fetchData();
      } else {
        alert('Failed to save product');
      }
    } catch (err) {
      alert('Error saving product');
    }
  };

  const handleEdit = (product) => {
    const imgList = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : (product.img ? [product.img] : []);

    setFormData({
      id: product.id,
      brand: product.brand,
      name: product.name,
      price: product.price,
      size: product.size || 'Free',
      category: product.category || 'General',
      img: product.img || imgList[0] || '',
      images: imgList,
      status: product.status || 'Available',
      drop_date: product.drop_date || ''
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert('Error deleting product');
    }
  };

  const openNewForm = (initialStatus = 'Available') => {
    setFormData({
      id: '',
      brand: 'Vixara',
      name: '',
      price: '',
      size: 'M',
      category: 'Sarees',
      img: '',
      images: [],
      status: initialStatus,
      drop_date: initialStatus === 'Coming Soon' ? 'Next Capsule Drop' : ''
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleQuickStatusChange = async (product, newStatus) => {
    try {
      await fetch(`${API_URL}/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...product, status: newStatus })
      });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleLaunch = async (e) => {
    e.preventDefault();
    const result = await launchProductWithPrice({
      newPrice: priceInput,
      discountPercent,
      sku: 'VX-0417'
    });
    setLaunchResult(result);
  };

  // Pipeline Counts
  const comingSoonCount = products.filter(p => p.status === 'Coming Soon').length;
  const restockingCount = products.filter(p => p.status === 'Coming Back').length;
  const inStockCount = products.filter(p => !p.status || p.status === 'Available').length;
  const outOfStockCount = products.filter(p => p.status === 'Out of Stock').length;

  if (!token) {
    return (
      <div className="vx-root admin-login" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-login-card" style={{ background: 'var(--card)', padding: '40px', width: '100%', maxWidth: '400px' }}>
          <h2 className="display" style={{ marginBottom: '24px', textAlign: 'center' }}>Admin Access</h2>
          {error && <p style={{ color: '#ff4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16}/> {error}</p>}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input className="filter-btn" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck="false" required />
            <input className="filter-btn" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck="false" required />
            <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="vx-root admin-page" style={{ minHeight: '100vh', padding: '40px' }}>
      <div className="wrap">
        <header className="admin-header" style={{ position: 'relative', background: 'transparent', padding: '0', display: 'flex', justifyContent: 'space-between', marginBottom: '30px', border: 'none', backdropFilter: 'none' }}>
          <h2 className="display" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package /> Store Admin Control Center
          </h2>
          <button className="btn-ghost" onClick={handleLogout} style={{ padding: '8px 16px' }}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        {/* Admin Navigation Tabs */}
        <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid var(--hairline-strong)', paddingBottom: '16px' }}>
          <button className={`filter-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Package size={14} /> Catalog ({inStockCount})
          </button>
          <button className={`filter-btn ${activeTab === 'coming-soon' ? 'active' : ''}`} onClick={() => setActiveTab('coming-soon')} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Clock size={14} /> Coming Soon &amp; Pipeline ({comingSoonCount + restockingCount})
          </button>
          <button className={`filter-btn ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Users size={14} /> Leads ({leads.length})
          </button>
          <button className={`filter-btn ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <MessageSquare size={14} /> Feedback ({feedback.length})
          </button>
          <button className={`filter-btn ${activeTab === 'launch' ? 'active' : ''}`} onClick={() => setActiveTab('launch')} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Rocket size={14} /> Shopify Launch Engine
          </button>
        </div>

        {/* Coming Soon & Stock Pipeline Tab */}
        {activeTab === 'coming-soon' && (
          <section>
            <div className="pipeline-metrics">
              <div className="pipeline-card">
                <span>Coming Soon Items</span>
                <h4>{comingSoonCount}</h4>
              </div>
              <div className="pipeline-card">
                <span>Restocking Capsules</span>
                <h4 style={{ color: '#6ee7b7' }}>{restockingCount}</h4>
              </div>
              <div className="pipeline-card">
                <span>Live Pre-Order Leads</span>
                <h4 style={{ color: '#93c5fd' }}>{leads.length}</h4>
              </div>
              <div className="pipeline-card">
                <span>Archived / Sold Out</span>
                <h4 style={{ color: '#fca5a5' }}>{outOfStockCount}</h4>
              </div>
            </div>

            <div className="admin-section-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
              <div>
                <h3 className="display" style={{ fontSize: '24px', margin: 0 }}>Upcoming Drops &amp; Restock Pipeline</h3>
                <p style={{ color: 'var(--bone-dim)', fontSize: '13px', margin: '4px 0 0' }}>Manage upcoming pieces shown in the User Dashboard &amp; Coming Soon Vault.</p>
              </div>
              <button className="btn-primary" onClick={() => openNewForm('Coming Soon')} style={{ padding: '10px 20px' }}>
                <Plus size={16} /> Add Coming Soon Item
              </button>
            </div>

            <div className="admin-table-wrap" style={{ background: 'var(--card)', padding: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--hairline)', color: 'var(--bone-dim)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}>
                    <th style={{ padding: '12px' }}>Image</th>
                    <th style={{ padding: '12px' }}>SKU</th>
                    <th style={{ padding: '12px' }}>Name</th>
                    <th style={{ padding: '12px' }}>Price</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Expected Drop Date</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => p.status === 'Coming Soon' || p.status === 'Coming Back' || p.status === 'Out of Stock').map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                      <td style={{ padding: '12px' }}><img src={p.img} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover' }} /></td>
                      <td style={{ padding: '12px' }} className="mono">{p.id}</td>
                      <td style={{ padding: '12px' }}>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--bone-dim)' }}>{p.brand} · {p.category}</div>
                      </td>
                      <td style={{ padding: '12px' }}>${p.price}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`status-badge-admin ${p.status === 'Coming Soon' ? 'coming-soon' : p.status === 'Coming Back' ? 'coming-back' : 'out-of-stock'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--brass-bright)' }}>{p.drop_date || 'TBD'}</td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                        <button className="filter-btn" title="Promote to In Stock" onClick={() => handleQuickStatusChange(p, 'Available')} style={{ padding: '6px 10px', fontSize: 11 }}>
                          Make In Stock
                        </button>
                        <button className="filter-btn" onClick={() => handleEdit(p)} style={{ padding: '6px' }}><Edit2 size={14}/></button>
                        <button className="filter-btn" onClick={() => handleDelete(p.id)} style={{ padding: '6px', color: '#ff4444' }}><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                  {products.filter(p => p.status === 'Coming Soon' || p.status === 'Coming Back' || p.status === 'Out of Stock').length === 0 && (
                    <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--bone-dim)' }}>No upcoming pipeline pieces currently configured. Click "Add Coming Soon Item" above!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Regular Catalog Tab */}
        {activeTab === 'products' && (
          <>
            <div className="admin-section-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h3 className="display" style={{ fontSize: '24px', margin: 0 }}>Product Inventory ({products.length} Items)</h3>
                <p style={{ color: 'var(--bone-dim)', fontSize: '13px', margin: '4px 0 0' }}>Active catalog products, categories, and inventory statuses.</p>
              </div>
              <button className="btn-primary" onClick={() => openNewForm('Available')} style={{ padding: '10px 20px' }}>
                <Plus size={16} /> Add Product
              </button>
            </div>
            <div className="admin-table-wrap" style={{ background: 'var(--card)', padding: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--hairline)', color: 'var(--bone-dim)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}>
                    <th style={{ padding: '12px' }}>Image</th>
                    <th style={{ padding: '12px' }}>ID / SKU</th>
                    <th style={{ padding: '12px' }}>Brand</th>
                    <th style={{ padding: '12px' }}>Name</th>
                    <th style={{ padding: '12px' }}>Price</th>
                    <th style={{ padding: '12px' }}>Section / Status</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                      <td style={{ padding: '12px' }}><img src={p.img} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover' }} /></td>
                      <td style={{ padding: '12px' }} className="mono">{p.id}</td>
                      <td style={{ padding: '12px' }}>{p.brand}</td>
                      <td style={{ padding: '12px' }}>{p.name}</td>
                      <td style={{ padding: '12px' }}>${p.price}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`status-badge-admin ${(!p.status || p.status === 'Available') ? 'available' : p.status === 'Coming Soon' ? 'coming-soon' : p.status === 'Coming Back' ? 'coming-back' : 'out-of-stock'}`}>
                          {p.status || 'Available'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                        <button className="filter-btn" onClick={() => handleEdit(p)} style={{ padding: '6px' }}><Edit2 size={14}/></button>
                        <button className="filter-btn" onClick={() => handleDelete(p.id)} style={{ padding: '6px', color: '#ff4444' }}><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: 'var(--bone-dim)' }}>No products found.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Shopify Launch Engine */}
        {activeTab === 'launch' && (
          <section className="admin-launch-panel">
            <div className="admin-section-toolbar">
              <div>
                <h3 className="display" style={{ fontSize: '24px', margin: 0 }}>Shopify One-Click Launch Engine</h3>
                <p style={{ color: 'var(--bone-dim)', fontSize: '14px', marginTop: '8px' }}>Dynamic pricing and section controller.</p>
              </div>
              <Rocket className="accent-icon" size={30} />
            </div>
            <form className="admin-launch-form" onSubmit={handleLaunch}>
              <label className="admin-label">Launch Price ($)
                <input className="admin-input" type="number" min="100" value={priceInput} onChange={(e) => setPriceInput(Number(e.target.value))} />
              </label>
              <label className="admin-label">VIP Discount (%)
                <input className="admin-input" type="number" min="1" max="90" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
              </label>
              <button type="submit" className="btn-primary"><Zap size={14} /> One-Click Launch</button>
            </form>
            <div className="admin-launch-preview">
              <span>Reserved price</span>
              <strong>${calculateLaunchPricing(priceInput, discountPercent).finalPrice.toLocaleString()}</strong>
              <span>{discountPercent}% VIP discount</span>
            </div>
            {launchResult && (
              <div className="payload-box">
                <div className="payload-title"><Sliders size={14} /> Shopify Admin GraphQL Payload Sent</div>
                <p>{launchResult.message}</p>
                <pre>{JSON.stringify(launchResult.variables, null, 2)}</pre>
              </div>
            )}
          </section>
        )}

        {/* Customer Leads Tab */}
        {activeTab === 'leads' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h3 className="display" style={{ fontSize: '24px', margin: 0 }}>Customer Leads &amp; Pre-Orders ({leads.length})</h3>
              <p style={{ color: 'var(--bone-dim)', fontSize: '14px', marginTop: '8px' }}>Customers who requested VIP access or reserved upcoming sizes on the storefront.</p>
            </div>
            <div className="admin-table-wrap" style={{ background: 'var(--card)', padding: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--hairline)', color: 'var(--bone-dim)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Contact</th>
                    <th style={{ padding: '12px' }}>Size</th>
                    <th style={{ padding: '12px' }}>Comms Pref</th>
                    <th style={{ padding: '12px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                      <td style={{ padding: '12px' }} className="mono">{l.id}</td>
                      <td style={{ padding: '12px' }}>{l.email}</td>
                      <td style={{ padding: '12px' }}>{l.size || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>{l.comms_preference}</td>
                      <td style={{ padding: '12px', color: 'var(--bone-dim)' }}>{new Date(l.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {leads.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--bone-dim)' }}>No leads captured yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Bounce Feedback Tab */}
        {activeTab === 'feedback' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h3 className="display" style={{ fontSize: '24px', margin: 0 }}>Bounce Feedback ({feedback.length})</h3>
              <p style={{ color: 'var(--bone-dim)', fontSize: '14px', marginTop: '8px' }}>Reasons customers clicked "Pass" on products.</p>
            </div>
            <div className="admin-table-wrap" style={{ background: 'var(--card)', padding: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--hairline)', color: 'var(--bone-dim)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Reason</th>
                    <th style={{ padding: '12px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.map(f => (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--hairline-strong)' }}>
                      <td style={{ padding: '12px' }} className="mono">{f.id}</td>
                      <td style={{ padding: '12px' }}>{f.reason}</td>
                      <td style={{ padding: '12px', color: 'var(--bone-dim)' }}>{new Date(f.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {feedback.length === 0 && <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--bone-dim)' }}>No feedback captured yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Product Modal with Section & Status Selector */}
      {showForm && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card-custom admin-modal-card" style={{ background: 'var(--card)', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="display" style={{ marginBottom: '20px' }}>{isEditing ? 'Edit Item' : 'Post New Item'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Requirement 4: Section / Status Selection */}
              <div className="form-group-custom">
                <label style={{ fontSize: '12px', color: 'var(--brass-bright)', fontWeight: 600 }}>Where should this item be posted?</label>
                <div className="status-choice-grid">
                  {[
                    { id: 'Available', label: 'Available (Normal Catalog)', desc: 'Active stock on main storefront' },
                    { id: 'Coming Soon', label: 'Coming Soon (Upcoming Drops)', desc: 'Visible in Coming Soon section & Vault' },
                    { id: 'Coming Back', label: 'Coming Back (Restocking)', desc: 'Item in re-production / waitlist open' },
                    { id: 'Out of Stock', label: 'Out of Stock (Archived)', desc: 'Marked as sold out in archives' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      className={`status-choice-card ${formData.status === opt.id ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, status: opt.id })}
                    >
                      <strong>{opt.label}</strong>
                      <small>{opt.desc}</small>
                    </div>
                  ))}
                </div>
              </div>

              {(formData.status === 'Coming Soon' || formData.status === 'Coming Back') && (
                <label className="admin-label">
                  Expected Drop Date / Restock Note
                  <input
                    className="filter-btn"
                    style={{ width: '100%', marginTop: '6px' }}
                    name="drop_date"
                    placeholder="e.g. Oct 25, 2026 or Restocking in 4 days"
                    value={formData.drop_date || ''}
                    onChange={handleChange}
                  />
                </label>
              )}

              <label className="admin-label">ID / SKU (e.g. VX-0999) <input className="filter-btn" style={{ width: '100%', marginTop: '6px' }} name="id" value={formData.id} onChange={handleChange} required disabled={isEditing} /></label>
              <label className="admin-label">Brand <input className="filter-btn" style={{ width: '100%', marginTop: '6px' }} name="brand" value={formData.brand} onChange={handleChange} required /></label>
              <label className="admin-label">Name <input className="filter-btn" style={{ width: '100%', marginTop: '6px' }} name="name" value={formData.name} onChange={handleChange} required /></label>
              <label className="admin-label">Price ($) <input className="filter-btn" type="number" style={{ width: '100%', marginTop: '6px' }} name="price" value={formData.price} onChange={handleChange} required /></label>
              <label className="admin-label">Size <input className="filter-btn" style={{ width: '100%', marginTop: '6px' }} name="size" value={formData.size} onChange={handleChange} required /></label>
              <label className="admin-label">Category <input className="filter-btn" style={{ width: '100%', marginTop: '6px' }} name="category" value={formData.category} onChange={handleChange} required /></label>
              {/* Image Upload Zone & Previews (JPEG/PNG, single or multiple) */}
              <div className="form-group-custom">
                <label style={{ fontSize: '12px', color: 'var(--brass-bright)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Product Images (Upload JPEG or PNG · 1 or Multiple Angles)
                </label>
                <div 
                  className="admin-image-upload-zone"
                  onClick={() => document.getElementById('admin-file-input').click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <Upload size={24} style={{ color: 'var(--brass-bright)' }} />
                  <strong style={{ fontSize: '13px', color: 'var(--bone)' }}>Click or Drag &amp; Drop JPEG / PNG Images</strong>
                  <span>Supports single photo or multiple gallery angles (Front, Side, Detail)</span>
                  <input
                    id="admin-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files) handleImageFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>

                {formData.images && formData.images.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--bone-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Uploaded Angles ({formData.images.length}) · First photo is main cover
                    </div>
                    <div className="admin-thumbs-grid">
                      {formData.images.map((src, idx) => (
                        <div key={idx} className="admin-thumb-card">
                          <img src={src} alt={`Angle ${idx + 1}`} />
                          <button
                            type="button"
                            className="admin-thumb-remove"
                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                            title="Remove image"
                          >
                            <X size={12} />
                          </button>
                          <div className="admin-thumb-label">
                            {idx === 0 ? 'Primary' : `Angle ${idx + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}><CheckCircle size={16}/> Save Item</button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
