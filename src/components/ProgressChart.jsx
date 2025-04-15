import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/ProgressChart.css';

const ProgressChart = ({ exerciseData, exerciseName }) => {
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('weight'); // To toggle between weight and volume views

  useEffect(() => {
    // Format data for Recharts
    if (exerciseData && exerciseData.length > 0) {
      const formattedData = exerciseData.map(data => ({
        date: data.date,
        weight: data.weight,
        reps: data.reps,
        volume: data.volume
      }));
      setChartData(formattedData);
    }
  }, [exerciseData]);

  if (!chartData || chartData.length < 2) {
    return (
      <div className="chart-placeholder">
        <p>Need at least two workouts to generate a chart.</p>
        <p>Keep logging your workouts to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h4>{exerciseName} Progress</h4>

      <div className="chart-selector">
        <button
          className={`chart-tab ${chartType === 'weight' ? 'active' : ''}`}
          onClick={() => setChartType('weight')}
        >
          Weight Progress
        </button>
        <button
          className={`chart-tab ${chartType === 'volume' ? 'active' : ''}`}
          onClick={() => setChartType('volume')}
        >
          Volume Progress
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 10,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            height={50}
            tickFormatter={(value) => {
              // On mobile, potentially shorter date format
              if (window.innerWidth < 480) {
                // Extract month and day from the date string
                const parts = value.split('/');
                return parts.length > 1 ? `${parts[0]}/${parts[1]}` : value;
              }
              return value;
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {chartType === 'weight' ? (
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              name="Weight (kg)"
              strokeWidth={2}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#82ca9d"
              activeDot={{ r: 8 }}
              name="Volume (kg)"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="chart-stats">
        {chartType === 'weight' ? (
          <div className="stat-highlight">
            <p>Starting weight: <strong>{chartData[0].weight} kg</strong></p>
            <p>Current weight: <strong>{chartData[chartData.length - 1].weight} kg</strong></p>
            <p>Progress: <strong>{(chartData[chartData.length - 1].weight - chartData[0].weight).toFixed(1)} kg</strong></p>
          </div>
        ) : (
          <div className="stat-highlight">
            <p>Starting volume: <strong>{chartData[0].volume} kg</strong></p>
            <p>Current volume: <strong>{chartData[chartData.length - 1].volume} kg</strong></p>
            <p>Progress: <strong>{(chartData[chartData.length - 1].volume - chartData[0].volume).toFixed(1)} kg</strong></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressChart;