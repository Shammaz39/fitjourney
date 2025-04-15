import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { firestore } from "../firebase/firebase";
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/LogWorkout.css";

const LogWorkout = () => {
  const { user } = useContext(AuthContext);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutLog, setWorkoutLog] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [todaysExercises, setTodaysExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const navigate = useNavigate();

  // Get the current day of the week
  const getCurrentDayOfWeek = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  };

  useEffect(() => {
    if (!user) return;

    const fetchUserWorkout = async () => {
      try {
        setLoading(true);
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.workoutPlan) {
            setSelectedWorkout(userData.workoutPlan);

            // Find today's exercises based on the current day
            const currentDay = getCurrentDayOfWeek();
            let exercises = [];

            // Look for the day in the workout plan
            // This handles both "Monday" and "Push (Monday)" formats
            Object.entries(userData.workoutPlan.days || {}).forEach(([day, dayExercises]) => {
              if (day.includes(currentDay)) {
                exercises = dayExercises;
              }
            });

            setTodaysExercises(exercises);

            // Initialize workout log with empty structure
            const initialLog = {};
            if (exercises.length > 0) {
              exercises.forEach(exercise => {
                initialLog[exercise] = { sets: [], weight: "", reps: "" };
              });
            }
            setWorkoutLog(initialLog);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user workout:", error);
        setLoading(false);
      }
    };

    fetchUserWorkout();
  }, [user]);

  const handleSetChange = (exercise, setIndex, field, value) => {
    setWorkoutLog(prev => {
      const updatedSets = [...(prev[exercise]?.sets || [])];

      // Ensure the set exists in the array
      if (!updatedSets[setIndex]) {
        updatedSets[setIndex] = { weight: "", reps: "" };
      }

      // Update the specific field
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [field]: value
      };

      return {
        ...prev,
        [exercise]: {
          ...prev[exercise],
          sets: updatedSets
        }
      };
    });
  };

  const addSet = (exercise) => {
    setWorkoutLog(prev => {
      const updatedSets = [...(prev[exercise]?.sets || []), { weight: "", reps: "" }];
      return {
        ...prev,
        [exercise]: {
          ...prev[exercise],
          sets: updatedSets
        }
      };
    });
  };

  const removeSet = (exercise, setIndex) => {
    setWorkoutLog(prev => {
      const updatedSets = [...(prev[exercise]?.sets || [])];
      updatedSets.splice(setIndex, 1);
      return {
        ...prev,
        [exercise]: {
          ...prev[exercise],
          sets: updatedSets
        }
      };
    });
  };

  const handleExerciseSelection = (exercise) => {
    setSelectedExercises(prev => {
      if (prev.includes(exercise)) {
        return prev.filter(ex => ex !== exercise);
      } else {
        return [...prev, exercise]; // Allow selecting any number of exercises
      }
    });
  };

  const handleSaveWorkout = async () => {
    if (!user || !selectedWorkout) return;

    try {
      const workoutRef = doc(firestore, "users", user.uid);

      // Create a copy of workout log with only the selected exercises
      const selectedLog = {};
      let isValid = true;
      let emptyExercises = [];

      // Check if at least one exercise is selected
      if (selectedExercises.length === 0) {
        alert("Please select at least one exercise to log.");
        return;
      }

      // Validate only the selected exercises
      selectedExercises.forEach(exercise => {
        selectedLog[exercise] = workoutLog[exercise];

        if (!workoutLog[exercise]?.sets || workoutLog[exercise]?.sets.length === 0) {
          isValid = false;
          emptyExercises.push(exercise);
        }
      });

      if (!isValid) {
        alert(`Please add sets for: ${emptyExercises.join(", ")}`);
        return;
      }

      const workoutEntry = {
        date: currentDate,
//         timestamp: serverTimestamp(),
        workout: selectedLog,
        notes: notes
      };

      // Save workout to user's history
      await updateDoc(workoutRef, {
        workoutHistory: arrayUnion(workoutEntry)
      });

      alert("Workout saved successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to save workout. Try again.");
    }
  };

  if (loading) return <div className="loading">Loading workout details...</div>;

  return (
    <div className="log-workout-container">
      <h2 className="page-title">Log Your Workout</h2>

      <div className="date-picker">
        <label htmlFor="workout-date">Workout Date:</label>
        <input
          type="date"
          id="workout-date"
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
        />
      </div>

      {selectedWorkout ? (
        <div className="workout-form">
          <h3 className="workout-name">{selectedWorkout.name}</h3>

          {todaysExercises.length > 0 ? (
            <>
              <div className="exercise-selection">
                <h4>Today's Exercises ({getCurrentDayOfWeek()})</h4>
                <p className="selection-hint">Select exercises for today's workout:</p>

                <div className="exercise-checkboxes">
                  {todaysExercises.map(exercise => (
                    <div key={`select-${exercise}`} className="exercise-checkbox">
                      <input
                        type="checkbox"
                        id={`checkbox-${exercise}`}
                        checked={selectedExercises.includes(exercise)}
                        onChange={() => handleExerciseSelection(exercise)}
                      />
                      <label htmlFor={`checkbox-${exercise}`}>{exercise}</label>
                    </div>
                  ))}
                </div>
              </div>

              {selectedExercises.map(exercise => (
                <div key={exercise} className="exercise-card">
                  <h4 className="exercise-name">{exercise}</h4>

                  <table className="sets-table">
                    <thead>
                      <tr>
                        <th>Set</th>
                        <th>Weight (kg)</th>
                        <th>Reps</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workoutLog[exercise]?.sets.map((set, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <input
                              type="number"
                              placeholder="Weight"
                              value={set.weight}
                              onChange={(e) => handleSetChange(exercise, index, "weight", e.target.value)}
                              min="0"
                              className="input-field"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              placeholder="Reps"
                              value={set.reps}
                              onChange={(e) => handleSetChange(exercise, index, "reps", e.target.value)}
                              min="0"
                              className="input-field"
                            />
                          </td>
                          <td>
                            <button
                              onClick={() => removeSet(exercise, index)}
                              className="remove-set-btn"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button
                    onClick={() => addSet(exercise)}
                    className="add-set-btn"
                  >
                    Add Set
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="no-exercises-today">
              <p>No exercises scheduled for today ({getCurrentDayOfWeek()}).</p>
              <p>Would you like to do an alternative workout?</p>
              {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 && (
                <div className="alternative-exercises">
                  <h4>Available Exercises:</h4>
                  <div className="exercise-checkboxes">
                    {selectedWorkout.exercises.slice(0, 6).map(exercise => (
                      <div key={`select-${exercise}`} className="exercise-checkbox">
                        <input
                          type="checkbox"
                          id={`checkbox-${exercise}`}
                          checked={selectedExercises.includes(exercise)}
                          onChange={() => handleExerciseSelection(exercise)}
                        />
                        <label htmlFor={`checkbox-${exercise}`}>{exercise}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="notes-section">
            <h4>Workout Notes</h4>
            <textarea
              placeholder="How did you feel? Any PRs? Notes for next time..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
              className="notes-input"
            />
          </div>

          <div className="buttons-container">
            <button onClick={() => navigate("/dashboard")} className="cancel-btn">
              Cancel
            </button>
            <button onClick={handleSaveWorkout} className="save-btn">
              Save Workout
            </button>
          </div>
        </div>
      ) : (
        <div className="no-workout-selected">
          <p>No workout plan selected.</p>
          <button onClick={() => navigate("/select-workout")} className="select-plan-btn">
            Select a Workout Plan
          </button>
        </div>
      )}
    </div>
  );
};

export default LogWorkout;