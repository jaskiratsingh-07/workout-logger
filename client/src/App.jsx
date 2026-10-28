import { useState, useEffect } from 'react';

function App() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/workouts')
      .then((res) => res.json())
      .then((data) => setWorkouts(data));
  }, []);

  return (
    <div>
      <h1>Workout Logger</h1>
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