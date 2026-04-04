import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });
import express from "express";
import cors from "cors";
import { mockAuth } from "./middleware/auth.js";
import "./services/db.js"; // Side-effect: initializes SQLite + runs schema + seeds
import tripsRouter from "./routes/trips.js";
import ordersRouter from "./routes/orders.js";
import bookingsRouter from "./routes/bookings.js";
import vaultRouter from "./routes/vault.js";
import tripRequestsRouter from "./routes/trip-requests.js";
import invoicesRouter from "./routes/invoices.js";
import merchantRouter from "./routes/merchant.js";
import simulationRouter from "./routes/simulation.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(mockAuth);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", tripsRouter);
app.use("/api", ordersRouter);
app.use("/api", bookingsRouter);
app.use("/api", vaultRouter);
app.use("/api", tripRequestsRouter);
app.use("/api", invoicesRouter);
app.use("/api", merchantRouter);
app.use("/api", simulationRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TERRA server running on :${PORT}`));
