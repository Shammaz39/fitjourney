import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { firestore } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ProgressChart from "../components/ProgressChart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import "../styles/ProgressTracker.css";

const ProgressTracker = () => {
  const { user } = useContext(AuthContext);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [bodyMeasurements, setBodyMeasurements] = useState([]);
  const [activeTab, setActiveTab] = useState("workout"); // Added tab state for mobile
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Get workout history and sort by date
          const history = userData.workoutHistory || [];
          history.sort((a, b) => new Date(a.date) - new Date(b.date));
          setWorkoutHistory(history);

          // Extract all unique exercises
          const allExercises = new Set();
          history.forEach(workout => {
            Object.keys(workout.workout || {}).forEach(exercise => {
              allExercises.add(exercise);
            });
          });

          setExercises(Array.from(allExercises));
          if (allExercises.size > 0) {
            setSelectedExercise(Array.from(allExercises)[0]);
          }

          // Get body measurements history
          if (userData.bodyMeasurements) {
            setBodyMeasurements(userData.bodyMeasurements.sort((a, b) =>
              new Date(a.date) - new Date(b.date)
            ));
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Process data for the selected exercise
  const getExerciseProgressData = () => {
    if (!selectedExercise) return [];

    return workoutHistory
      .filter(workout => workout.workout && workout.workout[selectedExercise])
      .map(workout => {
        // Find the best set (highest weight * reps)
        let bestSet = { weight: 0, reps: 0, total: 0 };

        const exerciseData = workout.workout[selectedExercise];
        if (exerciseData.sets && exerciseData.sets.length > 0) {
          exerciseData.sets.forEach(set => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps) || 0;
            const total = weight * reps;

            if (total > bestSet.total) {
              bestSet = { weight, reps, total };
            }
          });
        }

        return {
          date: new Date(workout.date).toLocaleDateString(),
          weight: bestSet.weight,
          reps: bestSet.reps,
          volume: bestSet.total
        };
      });
  };

  // Format body measurement data for charts
  const getBodyMeasurementData = () => {
    return bodyMeasurements.map(measurement => ({
      date: new Date(measurement.date).toLocaleDateString(),
      weight: parseFloat(measurement.weight) || 0,
      chest: parseFloat(measurement.measurements?.chest) || 0,
      waist: parseFloat(measurement.measurements?.waist) || 0,
      arms: parseFloat(measurement.measurements?.arms) || 0,
      thighs: parseFloat(measurement.measurements?.thighs) || 0,
    }));
  };

  const exerciseData = getExerciseProgressData();
  const bodyData = getBodyMeasurementData();

  if (loading) return <div className="loading">Loading your progress...</div>;

  return (
    <div className="progress-container">
      <h2 className="page-title">Your Progress Tracker</h2>

      <div className="progress-tabs">
        <button
          className={`tab-btn ${activeTab === "workout" ? "active" : ""}`}
          onClick={() => setActiveTab("workout")}
        >
          Workout Progress
        </button>
        <button
          className={`tab-btn ${activeTab === "body" ? "active" : ""}`}
          onClick={() => setActiveTab("body")}
        >
          Body Measurements
        </button>
        <button className="tab-btn" onClick={() => navigate("/transformation")}>
          Photo Gallery
        </button>
      </div>

      {activeTab === "workout" && exercises.length > 0 ? (
        <div className="workout-progress-section">
          <div className="exercise-selector">
            <label htmlFor="exercise-select">Select Exercise:</label>
            <select
              id="exercise-select"
              value={selectedExercise || ""}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="exercise-dropdown"
            >
              {exercises.map(exercise => (
                <option key={exercise} value={exercise}>
                  {exercise}
                </option>
              ))}
            </select>
          </div>

          {selectedExercise && (
            <div className="exercise-progress">
              <h3>{selectedExercise} Progress</h3>

              {exerciseData.length > 0 ? (
                <>
                  <div className="stats-summary">
                    <div className="stat-card">
                      <h5>Max Weight</h5>
                      <p>{Math.max(...exerciseData.map(d => d.weight))} kg</p>
                    </div>
                    <div className="stat-card">
                      <h5>Max Reps</h5>
                      <p>{Math.max(...exerciseData.map(d => d.reps))}</p>
                    </div>
                    <div className="stat-card">
                      <h5>Best Volume</h5>
                      <p>{Math.max(...exerciseData.map(d => d.volume))} kg</p>
                    </div>
                  </div>

                  <div className="chart-container">
                    <h4>Weight Progress (kg)</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={exerciseData}
                        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                          name="Weight (kg)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-container">
                    <h4>Volume Progress (kg)</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={exerciseData}
                        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="volume"
                          stroke="#82ca9d"
                          activeDot={{ r: 8 }}
                          name="Volume (kg)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mobile-data-table">
                    <h4>Progress Details:</h4>
                    <div className="table-wrapper">
                      <table className="progress-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Weight (kg)</th>
                            <th>Reps</th>
                            <th>Volume (kg)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exerciseData.map((data, index) => (
                            <tr key={index}>
                              <td>{data.date}</td>
                              <td>{data.weight}</td>
                              <td>{data.reps}</td>
                              <td>{data.volume}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <p className="no-data">No data available for {selectedExercise} yet.</p>
              )}
            </div>
          )}
        </div>
      ) : activeTab === "workout" ? (
        <div className="no-workout-data">
          <p>You haven't logged any workouts yet.</p>
          <button onClick={() => navigate("/log-workout")} className="log-workout-btn">
            Log Your First Workout
          </button>
        </div>
      ) : null}

      {/* Body Measurements Section */}
      {activeTab === "body" && bodyMeasurements.length > 0 ? (
        <div className="body-measurements-section">
          <h3>Body Measurements Progress</h3>

          <div className="body-chart">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={bodyData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#8884d8" name="Weight (kg)" />
                <Line type="monotone" dataKey="chest" stroke="#82ca9d" name="Chest (cm)" />
                <Line type="monotone" dataKey="waist" stroke="#ffc658" name="Waist (cm)" />
                <Line type="monotone" dataKey="arms" stroke="#ff8042" name="Arms (cm)" />
                <Line type="monotone" dataKey="thighs" stroke="#0088fe" name="Thighs (cm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {bodyMeasurements.length > 0 && (
            <div className="latest-measurements">
              <h4>Latest Measurements ({new Date(bodyMeasurements[bodyMeasurements.length - 1].date).toLocaleDateString()})</h4>
              <div className="measurements-grid">
                <div className="measurement-card">
                  <span className="label">Weight:</span>
                  <span className="value">{bodyMeasurements[bodyMeasurements.length - 1].weight} kg</span>
                </div>
                <div className="measurement-card">
                  <span className="label">Chest:</span>
                  <span className="value">{bodyMeasurements[bodyMeasurements.length - 1].measurements?.chest || "N/A"} cm</span>
                </div>
                <div className="measurement-card">
                  <span className="label">Waist:</span>
                  <span className="value">{bodyMeasurements[bodyMeasurements.length - 1].measurements?.waist || "N/A"} cm</span>
                </div>
                <div className="measurement-card">
                  <span className="label">Arms:</span>
                  <span className="value">{bodyMeasurements[bodyMeasurements.length - 1].measurements?.arms || "N/A"} cm</span>
                </div>
                <div className="measurement-card">
                  <span className="label">Thighs:</span>
                  <span className="value">{bodyMeasurements[bodyMeasurements.length - 1].measurements?.thighs || "N/A"} cm</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "body" ? (
        <div className="no-measurement-data">
          <p>You haven't recorded any body measurements yet.</p>
          <button onClick={() => navigate("/profile")} className="add-measurements-btn">
            Add Your First Measurements
          </button>
        </div>
      ) : null}

      <button onClick={() => navigate("/dashboard")} className="back-btn">
        Back to Dashboard
      </button>
    </div>
  );
};

export default ProgressTracker;