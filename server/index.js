const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/',(req,res) => {
    res.json({ message: 'FIRST SERVER :)'});
});
const pool = require('./db');

app.get('/db-test', async (req, res) => {
  const result = await pool.query('SELECT NOW()');
  res.json(result.rows[0]);
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
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});