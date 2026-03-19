import express from "express";
import dotenv from "dotenv";
import { query } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ message: "Fitness API running" });
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, email, created_at FROM users ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const result = await query(
      `INSERT INTO users (email, password)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email, password]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
