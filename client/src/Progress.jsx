import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

const API = 'http://localhost:5000';

function Progress({ token, exercises }) {
  const [exerciseId, setExerciseId] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!exerciseId) return;

    fetch(`${API}/progress/${exerciseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((rows) => {
        if (Array.isArray(rows)) setData(rows);
      });
  }, [exerciseId, token]);

  return (
    <div>
      <h2>Progress</h2>

      <select
        value={exerciseId}
        onChange={(e) => {
          setExerciseId(e.target.value);
          setData([]);
        }}
      >
        <option value="">Choose exercise</option>
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>

      {exerciseId && data.length === 0 && (
        <p>No sets logged for this exercise yet.</p>
      )}

      {data.length > 0 && (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis unit=" kg" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="max_weight"
                name="Max weight"
                stroke="#2563eb"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default Progress;