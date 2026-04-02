import express from "express";
import cors from "cors";
import { mockAuth } from "./middleware/auth.js";
import "./services/db.js"; // Side-effect: initializes SQLite + runs schema + seeds
import tripsRouter from "./routes/trips.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(mockAuth);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", tripsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TERRA server running on :${PORT}`));
