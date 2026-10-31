import { useState, useEffect } from 'react';

const API = 'http://localhost:5000';

function App() {
  const [workouts, setWorkouts] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState('');
  const [setInputs, setSetInputs] = useState({});

  useEffect(() => {
    fetch(`${API}/workouts`)
      .then((res) => res.json())
      .then((data) => setWorkouts(data));
  }, []);

  useEffect(() => {
    fetch(`${API}/exercises`)
      .then((res) => res.json())
      .then((data) => setExercises(data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch(`${API}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, notes }),
    });

    if (!res.ok) {
      alert('Could not save workout since the title is empty!');
      return;
    }

    const newWorkout = await res.json();
    setWorkouts([newWorkout, ...workouts]);
    setTitle('');
    setNotes('');
  }

  async function handleDelete(id) {
    const res = await fetch(`${API}/workouts/${id}`, { method: 'DELETE' });

    if (res.ok) {
      setWorkouts(workouts.filter((w) => w.id !== id));
    }
  }

  async function refreshSelected(id) {
    const res = await fetch(`${API}/workouts/${id}`);
    const data = await res.json();
    setSelected(data);
  }

  async function handleSelect(id) {
    if (selected && selected.id === id) {
      setSelected(null);
      return;
    }
    refreshSelected(id);
  }

  async function handleAddExercise(workoutId) {
    if (!exerciseId) return;

    const res = await fetch(`${API}/workouts/${workoutId}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: Number(exerciseId) }),
    });

    if (!res.ok) {
      alert('Could not add exercise.');
      return;
    }

    setExerciseId('');
    refreshSelected(workoutId);
  }

  function updateInput(weId, field, value) {
    setSetInputs({
      ...setInputs,
      [weId]: { ...setInputs[weId], [field]: value },
    });
  }

  async function handleAddSet(workoutId, weId) {
    const input = setInputs[weId] || {};

    if (!input.reps) {
      alert('Reps are required.');
      return;
    }

    const res = await fetch(`${API}/workout-exercises/${weId}/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reps: Number(input.reps),
        weight: input.weight ? Number(input.weight) : 0,
      }),
    });

    if (!res.ok) {
      alert('Could not add set.');
      return;
    }

    setSetInputs({ ...setInputs, [weId]: { reps: '', weight: '' } });
    refreshSelected(workoutId);
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
            <span
              onClick={() => handleSelect(w.id)}
              style={{ cursor: 'pointer' }}
            >
              {w.title}: {w.notes}
            </span>{' '}
            <button onClick={() => handleDelete(w.id)}>Delete</button>

            {selected && selected.id === w.id && (
              <div>
                {selected.exercises.length === 0 && <p>No exercises yet.</p>}

                {selected.exercises.map((ex) => (
                  <div key={ex.workout_exercise_id}>
                    <strong>{ex.name}</strong>
                    {ex.sets.length === 0 && <p>No sets yet.</p>}
                    <ul>
                      {ex.sets.map((s, index) => (
                        <li key={s.id}>
                          Set {index + 1}: {s.reps} reps at {s.weight} kg
                        </li>
                      ))}
                    </ul>
                    <input
                      placeholder="Reps"
                      type="number"
                      value={setInputs[ex.workout_exercise_id]?.reps || ''}
                      onChange={(e) =>
                        updateInput(
                          ex.workout_exercise_id,
                          'reps',
                          e.target.value
                        )
                      }
                    />
                    <input
                      placeholder="Weight (kg)"
                      type="number"
                      value={setInputs[ex.workout_exercise_id]?.weight || ''}
                      onChange={(e) =>
                        updateInput(
                          ex.workout_exercise_id,
                          'weight',
                          e.target.value
                        )
                      }
                    />
                    <button
                      onClick={() =>
                        handleAddSet(w.id, ex.workout_exercise_id)
                      }
                    >
                      Add set
                    </button>
                  </div>
                ))}

                <select
                  value={exerciseId}
                  onChange={(e) => setExerciseId(e.target.value)}
                >
                  <option value="">Choose exercise</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
                <button onClick={() => handleAddExercise(w.id)}>
                  Add exercise
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;