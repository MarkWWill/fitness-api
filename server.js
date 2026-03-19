import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { query } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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

app.get("/exercises", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, muscle_group, created_at FROM exercises ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/exercises", async (req, res) => {
  try {
    const { name, muscleGroup } = req.body;

    if (!name || !muscleGroup) {
      return res.status(400).json({ error: "name and muscleGroup are required" });
    }

    const result = await query(
      `INSERT INTO exercises (name, muscle_group)
       VALUES ($1, $2)
       RETURNING id, name, muscle_group, created_at`,
      [name, muscleGroup]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/workouts", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, user_id, name, created_at
       FROM workouts
       ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/workouts", async (req, res) => {
  try {
    const { userId, name } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: "userId and name are required" });
    }

    const result = await query(
      `INSERT INTO workouts (user_id, name)
       VALUES ($1, $2)
       RETURNING id, user_id, name, created_at`,
      [userId, name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/workouts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const workoutResult = await query(
      `SELECT id, user_id, name, created_at
       FROM workouts
       WHERE id = $1`,
      [id]
    );

    if (workoutResult.rows.length === 0) {
      return res.status(404).json({ error: "Workout not found" });
    }

    const setsResult = await query(
      `SELECT
         ws.id,
         ws.workout_id,
         ws.exercise_id,
         ws.reps,
         ws.weight,
         ws.created_at,
         e.name AS exercise_name,
         e.muscle_group
       FROM workout_sets ws
       JOIN exercises e ON e.id = ws.exercise_id
       WHERE ws.workout_id = $1
       ORDER BY ws.id ASC`,
      [id]
    );

    res.json({
      ...workoutResult.rows[0],
      sets: setsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/sets", async (req, res) => {
  try {
    const { workoutId, exerciseId, reps, weight } = req.body;

    if (!workoutId || !exerciseId || reps == null || weight == null) {
      return res.status(400).json({
        error: "workoutId, exerciseId, reps, and weight are required"
      });
    }

    const result = await query(
      `INSERT INTO workout_sets (workout_id, exercise_id, reps, weight)
       VALUES ($1, $2, $3, $4)
       RETURNING id, workout_id, exercise_id, reps, weight, created_at`,
      [workoutId, exerciseId, reps, weight]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
