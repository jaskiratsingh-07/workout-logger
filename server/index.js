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
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});