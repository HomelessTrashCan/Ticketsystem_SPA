import express from "express";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import ticketsRouter from "./api/tickets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Azure setzt PORT automatisch -> nicht fix auf 4000 verlassen
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// API
app.use("/api/tickets", ticketsRouter);

// Frontend (Vite build liegt im Projekt-Root: /dist)
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));

// SPA-Fallback (React Router)
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Data file: src/data/tickethistory.json
const DATA_FILE = path.join(__dirname, '..', 'data', 'tickethistory.json');

/*
async function readTickets() {
  try {
    const txt = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}
*/

app.use('/api/tickets', ticketsRouter);

app.listen(PORT, () => {
  console.log(`Ticket server listening on http://localhost:${PORT}`);
  /*
  console.log(`Data file: ${DATA_FILE}`);
  */
});