import { useState, useEffect } from 'react';

const API = 'http://localhost:5000';

function App() {
  const [workouts, setWorkouts] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch(`${API}/workouts`)
      .then((res) => res.json())
      .then((data) => setWorkouts(data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch(`${API}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, notes }),
    });

    const newWorkout = await res.json();
    setWorkouts([newWorkout, ...workouts]);
    setTitle('');
    setNotes('');
  }

  return (
    <div>
      <h1>Workout Logger</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="submit">Add workout</button>
      </form>

      <ul>
        {workouts.map((w) => (
          <li key={w.id}>
            {w.title}: {w.notes}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;