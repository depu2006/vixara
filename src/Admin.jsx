import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, LogOut, CheckCircle, AlertCircle, Users, MessageSquare } from 'lucide-react';
import { Rocket, Sliders, Zap } from 'lucide-react';
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
    id: '', brand: '', name: '', price: '', size: '', category: '', img: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing ? `${API_URL}/api/products/${formData.id}` : `${API_URL}/api/products`;
    const method = isEditing ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
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
    setFormData(product);
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

  const openNewForm = () => {
    setFormData({ id: '', brand: '', name: '', price: '', size: '', category: '', img: '' });
    setIsEditing(false);
    setShowForm(true);
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
            <Package /> Store Admin
          </h2>
          <button className="btn-ghost" onClick={handleLogout} style={{ padding: '8px 16px' }}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid var(--hairline-strong)', paddingBottom: '16px' }}>
          <button className={`filter-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Package size={14} /> Catalog
          </button>
          <button className={`filter-btn ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Users size={14} /> Leads
          </button>
          <button className={`filter-btn ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <MessageSquare size={14} /> Feedback
          </button>
          <button className={`filter-btn ${activeTab === 'launch' ? 'active' : ''}`} onClick={() => setActiveTab('launch')} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Rocket size={14} /> Launch
          </button>
        </div>

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

        {activeTab === 'products' && (
          <>
            <div className="admin-section-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 className="display" style={{ fontSize: '24px', margin: 0 }}>Product Inventory</h3>
              <button className="btn-primary" onClick={openNewForm} style={{ padding: '10px 20px' }}>
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
                    <th style={{ padding: '12px' }}>Category</th>
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
                      <td style={{ padding: '12px' }}>{p.category}</td>
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

        {activeTab === 'leads' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h3 className="display" style={{ fontSize: '24px', margin: 0 }}>Customer Leads (Waitlist)</h3>
              <p style={{ color: 'var(--bone-dim)', fontSize: '14px', marginTop: '8px' }}>Customers who clicked "Interested" on the storefront.</p>
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

        {activeTab === 'feedback' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h3 className="display" style={{ fontSize: '24px', margin: 0 }}>Bounce Feedback</h3>
              <p style={{ color: 'var(--bone-dim)', fontSize: '14px', marginTop: '8px' }}>Reasons customers clicked "Not Interested".</p>
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

      {/* Product Form Modal */}
      {showForm && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card-custom admin-modal-card" style={{ background: 'var(--card)', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="display" style={{ marginBottom: '24px' }}>{isEditing ? 'Edit Product' : 'New Product'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label className="admin-label">ID / SKU (e.g. VX-0999) <input className="filter-btn" style={{ width: '100%', marginTop: '8px' }} name="id" value={formData.id} onChange={handleChange} required disabled={isEditing} /></label>
              <label className="admin-label">Brand <input className="filter-btn" style={{ width: '100%', marginTop: '8px' }} name="brand" value={formData.brand} onChange={handleChange} required /></label>
              <label className="admin-label">Name <input className="filter-btn" style={{ width: '100%', marginTop: '8px' }} name="name" value={formData.name} onChange={handleChange} required /></label>
              <label className="admin-label">Price ($) <input className="filter-btn" type="number" style={{ width: '100%', marginTop: '8px' }} name="price" value={formData.price} onChange={handleChange} required /></label>
              <label className="admin-label">Size <input className="filter-btn" style={{ width: '100%', marginTop: '8px' }} name="size" value={formData.size} onChange={handleChange} required /></label>
              <label className="admin-label">Category <input className="filter-btn" style={{ width: '100%', marginTop: '8px' }} name="category" value={formData.category} onChange={handleChange} required /></label>
              <label className="admin-label">Image URL <input className="filter-btn" style={{ width: '100%', marginTop: '8px' }} name="img" value={formData.img} onChange={handleChange} required /></label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}><CheckCircle size={16}/> Save</button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
