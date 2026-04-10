import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createPool } from "./db.js";
import { ensureSchema } from "./ensureSchema.js";
import { registerAdminRoutes } from "./routes/adminRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "25mb" }));

const uploadDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadDir));

async function main() {
  const pool = createPool();
  await ensureSchema(pool);
  const jwtSecret = process.env.JWT_SECRET || "dev-only-change-me";
  registerAdminRoutes(app, pool, jwtSecret);
  const port = Number(process.env.PORT || 4000);
  app.listen(port, "0.0.0.0", () => {
    console.log(`Mobile admin API listening on http://127.0.0.1:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
