import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { firestore } from "../firebase/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const LogWorkout = () => {
  const { user } = useContext(AuthContext);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutLog, setWorkoutLog] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchUserWorkout = async () => {
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSelectedWorkout(userData.workoutPlan || null);
        }
      } catch (error) {
        console.error("Error fetching user workout:", error);
      }
    };

    fetchUserWorkout();
  }, [user]);

  const handleInputChange = (exercise, field, value) => {
    setWorkoutLog(prev => ({
      ...prev,
      [exercise]: {
        ...prev[exercise],
        [field]: value
      }
    }));
  };

  const handleSaveWorkout = async () => {
    if (!user || !selectedWorkout) return;

    try {
      const workoutRef = doc(firestore, "users", user.uid);
      await updateDoc(workoutRef, {
        workoutHistory: arrayUnion({
          date: new Date().toISOString(),
          workout: workoutLog
        })
      });

      alert("Workout saved successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to save workout. Try again.");
    }
  };

  return (
    <div>
      <h2>Log Your Workout</h2>
      {selectedWorkout ? (
        <div>
          <h3>Workout Plan: {selectedWorkout.name}</h3>
          {selectedWorkout.exercises ? (
            selectedWorkout.exercises.map(exercise => (
              <div key={exercise}>
                <p><strong>{exercise}</strong></p>
                <input
                  type="number"
                  placeholder="Sets"
                  onChange={(e) => handleInputChange(exercise, "sets", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Reps"
                  onChange={(e) => handleInputChange(exercise, "reps", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  onChange={(e) => handleInputChange(exercise, "weight", e.target.value)}
                />
              </div>
            ))
          ) : (
            <p>No exercises found for this plan.</p>
          )}
          <button onClick={handleSaveWorkout}>Save Workout</button>
        </div>
      ) : (
        <p>No workout plan selected.</p>
      )}
    </div>
  );
};

export default LogWorkout;
