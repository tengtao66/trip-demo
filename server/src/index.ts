import express from "express";
import cors from "cors";
import "./services/db.js"; // Side-effect: initializes SQLite + runs schema + seeds

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TERRA server running on :${PORT}`));
