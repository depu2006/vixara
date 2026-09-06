import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '', brand: '', name: '', price: '', size: '', category: '', img: ''
  });

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
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
        fetchProducts();
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
      fetchProducts();
    } catch (err) {
      alert('Error deleting product');
    }
  };

  const openNewForm = () => {
    setFormData({ id: '', brand: '', name: '', price: '', size: '', category: '', img: '' });
    setIsEditing(false);
    setShowForm(true);
  };

  if (!token) {
    return (
      <div className="vx-root" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--card)', padding: '40px', width: '100%', maxWidth: '400px' }}>
          <h2 className="display" style={{ marginBottom: '24px', textAlign: 'center' }}>Admin Access</h2>
          {error && <p style={{ color: '#ff4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16}/> {error}</p>}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input className="filter-btn" type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            <input className="filter-btn" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="vx-root" style={{ minHeight: '100vh', padding: '40px' }}>
      <div className="wrap">
        <header style={{ position: 'relative', background: 'transparent', padding: '0', display: 'flex', justifyContent: 'space-between', marginBottom: '40px', border: 'none', backdropFilter: 'none' }}>
          <h2 className="display" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package /> Store Admin
          </h2>
          <button className="btn-ghost" onClick={handleLogout} style={{ padding: '8px 16px' }}>
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 className="display" style={{ fontSize: '24px', margin: 0 }}>Catalog</h3>
          <button className="btn-primary" onClick={openNewForm} style={{ padding: '10px 20px' }}>
            <Plus size={16} /> Add Product
          </button>
        </div>

        <div style={{ background: 'var(--card)', padding: '20px', overflowX: 'auto' }}>
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
              {products.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: 'var(--bone-dim)' }}>No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card-custom" style={{ background: 'var(--card)', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
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
