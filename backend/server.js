import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'vixara_secret_key_change_in_prod';

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'vixara.db'), (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database.');
});

// Setup tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS AdminUsers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Products (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      size TEXT,
      category TEXT,
      img TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      size TEXT,
      comms_preference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default admin if none exists (admin / admin123)
  db.get('SELECT COUNT(*) as count FROM AdminUsers', async (err, row) => {
    if (!err && row.count === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      db.run('INSERT INTO AdminUsers (username, password) VALUES (?, ?)', ['admin', hash]);
      console.log('Created default admin: admin / admin123');
    }
  });

  // Insert mock products if none exist
  db.get('SELECT COUNT(*) as count FROM Products', (err, row) => {
    if (!err && row.count === 0) {
      const mockProducts = [
        { id: "VX-0417", brand: "Loro Piana", name: "Cashmere Overcoat", price: 3240, size: "M", category: "Outerwear", img: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=60" },
        { id: "VX-0552", brand: "Margiela", name: "Deconstructed Blazer", price: 1890, size: "48", category: "Tailoring", img: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=800&q=60" },
        { id: "VX-0603", brand: "Bottega Veneta", name: "Intrecciato Jacket", price: 2410, size: "L", category: "Outerwear", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=60" },
        { id: "VX-0689", brand: "Brunello Cucinelli", name: "Wool Knit Sweater", price: 1120, size: "S", category: "Knitwear", img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=60" },
        { id: "VX-0714", brand: "Saint Laurent", name: "Silk Shirt", price: 980, size: "40", category: "Tailoring", img: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=800&q=60" },
        { id: "VX-0771", brand: "Balenciaga", name: "Tailored Trousers", price: 1340, size: "32", category: "Tailoring", img: "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=800&q=60" },
      ];
      const stmt = db.prepare('INSERT INTO Products (id, brand, name, price, size, category, img) VALUES (?, ?, ?, ?, ?, ?, ?)');
      mockProducts.forEach(p => {
        stmt.run(p.id, p.brand, p.name, p.price, p.size, p.category, p.img);
      });
      stmt.finalize();
      console.log('Inserted mock products.');
    }
  });
});

// Middleware for admin auth
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// API Routes

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM AdminUsers WHERE username = ?', [username], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token });
  });
});

// Get Products
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM Products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add Product
app.post('/api/products', authenticateToken, (req, res) => {
  const { id, brand, name, price, size, category, img } = req.body;
  db.run(
    'INSERT INTO Products (id, brand, name, price, size, category, img) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, brand, name, price, size, category, img],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, brand, name, price, size, category, img });
    }
  );
});

// Update Product
app.put('/api/products/:id', authenticateToken, (req, res) => {
  const { brand, name, price, size, category, img } = req.body;
  const id = req.params.id;
  db.run(
    'UPDATE Products SET brand = ?, name = ?, price = ?, size = ?, category = ?, img = ? WHERE id = ?',
    [brand, name, price, size, category, img, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, brand, name, price, size, category, img });
    }
  );
});

// Delete Product
app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM Products WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: true });
  });
});

// Shopify Section Routes
app.post('/api/interest', (req, res) => {
  const { email, size, commsPreference } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  db.run('INSERT INTO Leads (email, size, comms_preference) VALUES (?, ?, ?)', [email, size, commsPreference], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT COUNT(*) as count FROM Leads', (err, row) => {
      res.json({ success: true, interestCount: row ? row.count : 1 });
    });
  });
});

app.post('/api/feedback', (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason is required' });
  
  db.run('INSERT INTO Feedback (reason) VALUES (?)', [reason], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/launch', (req, res) => {
  const { priceInput } = req.body;
  db.get('SELECT COUNT(*) as count FROM Leads', (err, row) => {
    const count = row ? row.count : 0;
    if (count < 50) {
      return res.json({ success: false, warning: `Only ${count} people interested. Recommended threshold is 50 before launch.` });
    }
    res.json({ success: true, message: `Launched successfully at $${priceInput}!` });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
