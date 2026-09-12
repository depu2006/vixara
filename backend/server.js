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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
      img TEXT,
      images TEXT,
      status TEXT DEFAULT 'Available',
      drop_date TEXT
    )
  `);

  // Safe migration for existing DB instances
  db.run(`ALTER TABLE Products ADD COLUMN status TEXT DEFAULT 'Available'`, () => {});
  db.run(`ALTER TABLE Products ADD COLUMN drop_date TEXT`, () => {});
  db.run(`ALTER TABLE Products ADD COLUMN images TEXT`, () => {});

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
        // Kurtis
        { id: "VX-1001", brand: "Vixara", name: "Anarkali Kurti – Rose Gold Thread", price: 1899, size: "M", category: "Kurtis", img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
        { id: "VX-1002", brand: "Vixara", name: "Chikankari White Cotton Kurti", price: 1499, size: "S", category: "Kurtis", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
        { id: "VX-1003", brand: "Vixara", name: "Ajrakh Print A-Line Kurti", price: 1299, size: "L", category: "Kurtis", img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=60", status: "Coming Soon", drop_date: "Oct 15, 2026" },
        { id: "VX-1004", brand: "Vixara", name: "Silk Blend Straight Kurti – Teal", price: 1699, size: "XL", category: "Kurtis", img: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=800&q=60", status: "Coming Back", drop_date: "Restocking in 4 days" },

        // Sarees
        { id: "VX-2001", brand: "Vixara", name: "Banarasi Silk Saree – Maroon", price: 4999, size: "Free", category: "Sarees", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
        { id: "VX-2002", brand: "Vixara", name: "Kanjivaram Pure Silk – Royal Blue", price: 6499, size: "Free", category: "Sarees", img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=60", status: "Coming Soon", drop_date: "Nov 01, 2026" },
        { id: "VX-2003", brand: "Vixara", name: "Linen Handloom Saree – Olive", price: 2999, size: "Free", category: "Sarees", img: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
        { id: "VX-2004", brand: "Vixara", name: "Georgette Party Saree – Blush Pink", price: 3499, size: "Free", category: "Sarees", img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=60", status: "Out of Stock", drop_date: "Vault Archive" },

        // Lehengas
        { id: "VX-3001", brand: "Vixara", name: "Bridal Lehenga – Heavy Embroidery", price: 12999, size: "M", category: "Lehengas", img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=60", status: "Coming Soon", drop_date: "Bridal Season Drop · Oct 20" },
        { id: "VX-3002", brand: "Vixara", name: "Pastel Mirror Work Lehenga", price: 8999, size: "S", category: "Lehengas", img: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d44?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
        { id: "VX-3003", brand: "Vixara", name: "Floral Print Lehenga – Sangeet", price: 5999, size: "L", category: "Lehengas", img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=60", status: "Coming Back", drop_date: "Restocking soon" },

        // Jhumkas & Jewellery
        { id: "VX-4001", brand: "Vixara", name: "Temple Gold Jhumka Earrings", price: 899, size: "Free", category: "Jhumkas", img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
        { id: "VX-4002", brand: "Vixara", name: "Oxidised Silver Chandbali", price: 699, size: "Free", category: "Jhumkas", img: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=800&q=60", status: "Coming Soon", drop_date: "Heritage Capsule · Nov 10" },
        { id: "VX-4003", brand: "Vixara", name: "Kundan Pearl Drop Jhumka", price: 1199, size: "Free", category: "Jhumkas", img: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
        { id: "VX-4004", brand: "Vixara", name: "Meenakari Lotus Jhumka – Pink", price: 999, size: "Free", category: "Jhumkas", img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },

        // Handbags
        { id: "VX-5001", brand: "Vixara", name: "Embroidered Potli Bag – Gold", price: 1599, size: "Free", category: "Handbags", img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
        { id: "VX-5002", brand: "Vixara", name: "Woven Jute Tote – Natural", price: 999, size: "Free", category: "Handbags", img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=60", status: "Coming Soon", drop_date: "Eco Luxe Line · Oct 28" },
        { id: "VX-5003", brand: "Vixara", name: "Leather Sling Bag – Tan", price: 2199, size: "Free", category: "Handbags", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
        { id: "VX-5004", brand: "Vixara", name: "Beaded Clutch – Midnight", price: 1299, size: "Free", category: "Handbags", img: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=60", status: "Out of Stock", drop_date: "" },

        // Casual Wear
        { id: "VX-6001", brand: "Vixara", name: "Wide-Leg Palazzo Set – Ivory", price: 1799, size: "M", category: "Casual", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
        { id: "VX-6002", brand: "Vixara", name: "Crop Top & Skirt Co-ord – Mustard", price: 1599, size: "S", category: "Casual", img: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=60", status: "Coming Back", drop_date: "New batch in production" },
        { id: "VX-6003", brand: "Vixara", name: "Denim Jacket – Embroidered", price: 2499, size: "L", category: "Casual", img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
        { id: "VX-6004", brand: "Vixara", name: "Boho Maxi Dress – Indigo Block", price: 1999, size: "M", category: "Casual", img: "https://images.unsplash.com/photo-1502716119720-b23a1e3e4bf0?auto=format&fit=crop&w=800&q=60", status: "Available", drop_date: "" },
      ];
      const stmt = db.prepare('INSERT INTO Products (id, brand, name, price, size, category, img, status, drop_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      mockProducts.forEach(p => {
        stmt.run(p.id, p.brand, p.name, p.price, p.size, p.category, p.img, p.status, p.drop_date);
      });
      stmt.finalize();
      console.log('Inserted 24 women\'s fashion products with status metadata.');
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
    const formatted = rows.map(r => {
      let imagesList = [];
      try {
        if (r.images) {
          imagesList = typeof r.images === 'string' ? JSON.parse(r.images) : r.images;
        }
      } catch (e) {
        imagesList = [];
      }
      if (!Array.isArray(imagesList) || imagesList.length === 0) {
        imagesList = r.img ? [r.img] : [];
      }
      return {
        ...r,
        images: imagesList,
        img: r.img || imagesList[0] || '',
        status: r.status || 'Available',
        drop_date: r.drop_date || ''
      };
    });
    res.json(formatted);
  });
});

// Add Product
app.post('/api/products', authenticateToken, (req, res) => {
  const { id, brand, name, price, size, category, img, images, status = 'Available', drop_date = '' } = req.body;
  const imagesArr = Array.isArray(images) && images.length > 0 ? images : (img ? [img] : []);
  const primaryImg = img || (imagesArr.length > 0 ? imagesArr[0] : '');
  const imagesJson = JSON.stringify(imagesArr);

  db.run(
    'INSERT INTO Products (id, brand, name, price, size, category, img, images, status, drop_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, brand, name, price, size, category, primaryImg, imagesJson, status, drop_date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, brand, name, price, size, category, img: primaryImg, images: imagesArr, status, drop_date });
    }
  );
});

// Update Product
app.put('/api/products/:id', authenticateToken, (req, res) => {
  const { brand, name, price, size, category, img, images, status = 'Available', drop_date = '' } = req.body;
  const id = req.params.id;
  const imagesArr = Array.isArray(images) && images.length > 0 ? images : (img ? [img] : []);
  const primaryImg = img || (imagesArr.length > 0 ? imagesArr[0] : '');
  const imagesJson = JSON.stringify(imagesArr);

  db.run(
    'UPDATE Products SET brand = ?, name = ?, price = ?, size = ?, category = ?, img = ?, images = ?, status = ?, drop_date = ? WHERE id = ?',
    [brand, name, price, size, category, primaryImg, imagesJson, status, drop_date, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, brand, name, price, size, category, img: primaryImg, images: imagesArr, status, drop_date });
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

// Admin get leads
app.get('/api/leads', authenticateToken, (req, res) => {
  db.all('SELECT * FROM Leads ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Admin get feedback
app.get('/api/feedback', authenticateToken, (req, res) => {
  db.all('SELECT * FROM Feedback ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Shopify Section Routes / Leads
app.post('/api/interest', (req, res) => {
  const { contact, email, size, commsPreference } = req.body;
  const contactValue = contact || email;
  if (!contactValue) return res.status(400).json({ error: 'Contact information is required' });
  const isEmail = commsPreference === 'Email';
  const contactIsValid = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue)
    : /^\d{10,15}$/.test(contactValue);
  if (!contactIsValid) {
    return res.status(400).json({ error: isEmail ? 'A valid email address is required' : 'A valid mobile number is required' });
  }
  
  db.run('INSERT INTO Leads (email, size, comms_preference) VALUES (?, ?, ?)', [contactValue, size, commsPreference], function(err) {
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

// AI Price Negotiation Agent API
app.post('/api/negotiate', (req, res) => {
  const { productId, originalPrice, proposedPrice, customerMessage, round = 1 } = req.body;
  const numOrig = Number(originalPrice);
  const numProp = Number(proposedPrice);

  if (!numOrig || !numProp || numProp <= 0) {
    return res.status(400).json({ error: 'Invalid negotiation parameters' });
  }

  const maxDiscountRatio = 0.20; // 20% max discount allowed by AI model
  const floorPrice = Math.round(numOrig * (1 - maxDiscountRatio));
  const proposedDiscount = Math.round(((numOrig - numProp) / numOrig) * 100);

  if (numProp >= numOrig) {
    return res.json({
      decision: 'ACCEPTED',
      agreedPrice: numOrig,
      discountPercent: 0,
      promoCode: 'FULL-HONOR',
      message: `We appreciate your interest! You can acquire this piece right now at its standard catalog valuation of $${numOrig.toLocaleString()}.`
    });
  }

  // If customer's offer is within approved floor range (<= 20% discount)
  if (numProp >= floorPrice) {
    const code = `AI-VIP-${Math.abs(proposedDiscount)}-${Math.floor(100 + Math.random() * 900)}`;
    return res.json({
      decision: 'ACCEPTED',
      agreedPrice: numProp,
      discountPercent: proposedDiscount,
      promoCode: code,
      message: `✨ Deal Approved! Our AI Negotiation Agent has matched your offer at $${numProp.toLocaleString()} (${proposedDiscount}% VIP concession). Use voucher code "${code}" at checkout to lock in this private rate.`
    });
  }

  // Customer offers below floor price -> AI makes an intelligent counter-proposal
  let counterDiscount = round === 1 ? 12 : 18; // Give 12% on round 1, up to 18% on round 2
  const counterPrice = Math.round(numOrig * (1 - (counterDiscount / 100)));
  const code = `AI-COUNTER-${counterDiscount}-${Math.floor(100 + Math.random() * 900)}`;

  return res.json({
    decision: 'COUNTER_OFFER',
    counterPrice: counterPrice,
    discountPercent: counterDiscount,
    floorPrice: floorPrice,
    promoCode: code,
    message: `🤖 Vixara AI Concierge: "While our provenance and authentication standards prevent us from approving $${numProp.toLocaleString()} (${proposedDiscount}% below valuation), I can authorize an exclusive private collector price of $${counterPrice.toLocaleString()} (${counterDiscount}% off) for your immediate reservation."`
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
