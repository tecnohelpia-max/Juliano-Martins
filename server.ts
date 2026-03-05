import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("charcutaria.db");

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId INTEGER,
    productName TEXT NOT NULL,
    weight REAL NOT NULL,
    pricePerKg REAL NOT NULL,
    total REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    orderId TEXT NOT NULL,
    FOREIGN KEY (clientId) REFERENCES clients(id)
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare("SELECT * FROM clients ORDER BY name ASC").all();
    res.json(clients);
  });

  app.post("/api/clients", (req, res) => {
    const { name, phone } = req.body;
    const result = db.prepare("INSERT INTO clients (name, phone) VALUES (?, ?)").run(name, phone);
    res.json({ id: result.lastInsertRowid, name, phone });
  });

  app.put("/api/clients/:id", (req, res) => {
    const { name, phone } = req.body;
    db.prepare("UPDATE clients SET name = ?, phone = ? WHERE id = ?").run(name, phone, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/clients/:id", (req, res) => {
    db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/sales", (req, res) => {
    const sales = db.prepare(`
      SELECT sales.*, clients.name as clientName, clients.phone as clientPhone 
      FROM sales 
      LEFT JOIN clients ON sales.clientId = clients.id 
      ORDER BY timestamp DESC
    `).all();
    res.json(sales);
  });

  app.post("/api/sales", (req, res) => {
    const { clientId, productName, weight, pricePerKg, total, orderId } = req.body;
    const result = db.prepare(`
      INSERT INTO sales (clientId, productName, weight, pricePerKg, total, orderId) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(clientId, productName, weight, pricePerKg, total, orderId);
    res.json({ id: result.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
