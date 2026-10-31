const express = require('express');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'FIRST SERVER :)' });
});

app.get('/workouts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM workouts ORDER BY workout_date DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/workouts', async (req, res) => {
  try {
    const { title, workout_date, notes } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO workouts (title, workout_date, notes) VALUES ($1, COALESCE($2, CURRENT_DATE), $3) RETURNING *',
      [title, workout_date, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.put('/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, workout_date, notes } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'UPDATE workouts SET title = $1, workout_date = COALESCE($2, workout_date), notes = $3 WHERE id = $4 RETURNING *',
      [title, workout_date, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.delete('/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM workouts WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    res.json({ message: 'Workout deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/exercises', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM exercises ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/exercises', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO exercises (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Exercise already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/workouts/:id/exercises', async (req, res) => {
  try {
    const { id } = req.params;
    const { exercise_id } = req.body;

    if (!exercise_id) {
      return res.status(400).json({ error: 'exercise_id is required' });
    }

    const result = await pool.query(
      'INSERT INTO workout_exercises (workout_id, exercise_id) VALUES ($1, $2) RETURNING *',
      [id, exercise_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Workout or exercise not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/workout-exercises/:id/sets', async (req, res) => {
  try {
    const { id } = req.params;
    const { reps, weight } = req.body;

    if (!reps) {
      return res.status(400).json({ error: 'reps is required' });
    }

    const result = await pool.query(
      'INSERT INTO sets (workout_exercise_id, reps, weight) VALUES ($1, $2, COALESCE($3, 0)) RETURNING *',
      [id, reps, weight]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Workout exercise not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const workoutResult = await pool.query(
      'SELECT * FROM workouts WHERE id = $1',
      [id]
    );

    if (workoutResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    const workout = workoutResult.rows[0];

    const detailResult = await pool.query(
      `SELECT
         we.id AS workout_exercise_id,
         e.id AS exercise_id,
         e.name,
         s.id AS set_id,
         s.reps,
         s.weight
       FROM workout_exercises we
       JOIN exercises e ON e.id = we.exercise_id
       LEFT JOIN sets s ON s.workout_exercise_id = we.id
       WHERE we.workout_id = $1
       ORDER BY we.id, s.id`,
      [id]
    );

    const exercises = [];

    for (const row of detailResult.rows) {
      let exercise = exercises.find(
        (ex) => ex.workout_exercise_id === row.workout_exercise_id
      );

      if (!exercise) {
        exercise = {
          workout_exercise_id: row.workout_exercise_id,
          exercise_id: row.exercise_id,
          name: row.name,
          sets: [],
        };
        exercises.push(exercise);
      }

      if (row.set_id) {
        exercise.sets.push({
          id: row.set_id,
          reps: row.reps,
          weight: row.weight,
        });
      }
    }

    workout.exercises = exercises;
    res.json(workout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});