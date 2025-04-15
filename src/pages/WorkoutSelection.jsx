import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { firestore } from "../firebase/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/WorkoutSelection.css";

// Complete workout plans with exercises
const defaultWorkoutPlans = [
  {
    id: "push_pull_legs",
    name: "Push Pull Legs",
    description: "A balanced workout focusing on pushing, pulling, and leg days.",
    days: {
      "Push (Monday)": ["Bench Press", "Overhead Press", "Incline Dumbbell Press", "Tricep Pushdowns", "Lateral Raises"],
      "Push (Tuesday)": ["Bench Press", "Overhead Press", "Incline Dumbbell Press", "Tricep Pushdowns", "Lateral Raises"],
      "Pull (Wednesday)": ["Deadlifts", "Pull-ups", "Barbell Rows", "Face Pulls", "Bicep Curls"],
      "Pull (Thursday)": ["Deadlifts", "Pull-ups", "Barbell Rows", "Face Pulls", "Bicep Curls"],
      "Legs (Friday)": ["Squats", "Leg Press", "Romanian Deadlifts", "Leg Extensions", "Calf Raises"],
      "Legs (Saturday)": ["Squats", "Leg Press", "Romanian Deadlifts", "Leg Extensions", "Calf Raises"]
    },
    exercises: [
      "Bench Press", "Overhead Press", "Incline Dumbbell Press", "Tricep Pushdowns", "Lateral Raises",
      "Deadlifts", "Pull-ups", "Barbell Rows", "Face Pulls", "Bicep Curls",
      "Squats", "Leg Press", "Romanian Deadlifts", "Leg Extensions", "Calf Raises"
    ]
  },
  {
    id: "full_body",
    name: "Full Body",
    description: "A full-body workout for each session.",
    days: {
      "Monday": ["Squats", "Bench Press", "Barbell Rows", "Overhead Press", "Bicep Curls", "Planks"],
      "Tuesday": ["Squats", "Bench Press", "Barbell Rows", "Overhead Press", "Bicep Curls", "Planks"],
      "Wednesday": ["Deadlifts", "Incline Press", "Pull-ups", "Lunges", "Tricep Extensions", "Leg Raises"],
      "Thursday": ["Deadlifts", "Incline Press", "Pull-ups", "Lunges", "Tricep Extensions", "Leg Raises"],
      "Friday": ["Leg Press", "Dips", "Lat Pulldowns", "Push-ups", "Calf Raises", "Russian Twists"],
      "Saturday": ["Leg Press", "Dips", "Lat Pulldowns", "Push-ups", "Calf Raises", "Russian Twists"]
    },
    exercises: [
      "Squats", "Bench Press", "Barbell Rows", "Overhead Press", "Bicep Curls", "Planks",
      "Deadlifts", "Incline Press", "Pull-ups", "Lunges", "Tricep Extensions", "Leg Raises",
      "Leg Press", "Dips", "Lat Pulldowns", "Push-ups", "Calf Raises", "Russian Twists"
    ]
  },
  {
    id: "upper_lower",
    name: "Upper Lower Split",
    description: "Splits workout into upper and lower body days.",
    days: {
      "Upper Body (Monday)": ["Bench Press", "Barbell Rows", "Overhead Press", "Pull-ups", "Tricep Extensions", "Bicep Curls"],
      "Lower Body (Tuesday)": ["Squats", "Romanian Deadlifts", "Leg Press", "Calf Raises", "Leg Curls", "Planks"],
      "Lower Body (Wednesday)": ["Squats", "Romanian Deadlifts", "Leg Press", "Calf Raises", "Leg Curls", "Planks"],
      "Upper Body (Thursday)": ["Incline Press", "Lat Pulldowns", "Lateral Raises", "Face Pulls", "Skull Crushers", "Hammer Curls"],
      "Lower Body (Friday)": ["Deadlifts", "Front Squats", "Lunges", "Leg Extensions", "Ab Rollouts", "Russian Twists"],
      "Lower Body (Saturday)": ["Deadlifts", "Front Squats", "Lunges", "Leg Extensions", "Ab Rollouts", "Russian Twists"]
    },
    exercises: [
      "Bench Press", "Barbell Rows", "Overhead Press", "Pull-ups", "Tricep Extensions", "Bicep Curls",
      "Squats", "Romanian Deadlifts", "Leg Press", "Calf Raises", "Leg Curls", "Planks",
      "Incline Press", "Lat Pulldowns", "Lateral Raises", "Face Pulls", "Skull Crushers", "Hammer Curls",
      "Deadlifts", "Front Squats", "Lunges", "Leg Extensions", "Ab Rollouts", "Russian Twists"
    ]
  }
];

const WorkoutSelection = () => {
  const { user } = useContext(AuthContext);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkoutPlans = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // First check if default plans should be loaded to Firestore
        const checkAndInitWorkouts = async () => {
          const workoutsCollectionRef = collection(firestore, "workouts");
          const querySnapshot = await getDocs(workoutsCollectionRef);

          // If no workout plans exist in Firestore, add the default ones
          if (querySnapshot.empty) {
            console.log("Initializing default workout plans in Firestore...");

            for (const plan of defaultWorkoutPlans) {
              const planRef = doc(firestore, "workouts", plan.id);
              await setDoc(planRef, {
                ...plan,
                createdAt: new Date(),
                isDefault: true
              });
            }
            return defaultWorkoutPlans;
          }

          // Otherwise, return the ones from Firestore
          return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        };

        // Load the workout plans
        const plans = await checkAndInitWorkouts();
        setWorkoutPlans(plans);

        // Check if user already has a selected plan
        const userRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && userDoc.data().workoutPlan) {
          setSelectedPlanId(userDoc.data().workoutPlan.id);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching workout plans:", error);
        setWorkoutPlans(defaultWorkoutPlans); // Fallback to default plans
        setLoading(false);
      }
    };

    if (user) {
      fetchWorkoutPlans();
    }
  }, [user]);

  const handleSelectPlan = async () => {
    if (!selectedPlanId) return alert("Please select a workout plan!");

    try {
      // Find the selected workout plan
      const selectedPlan = workoutPlans.find(plan => plan.id === selectedPlanId);

      if (!selectedPlan) {
        alert("Workout plan not found.");
        return;
      }

      // Store the selected plan inside the user's document
      const userRef = doc(firestore, "users", user.uid);

      // Store workout plan and initialize an empty workout history if it doesn't exist
      await setDoc(userRef, {
        workoutPlan: selectedPlan,
        lastUpdated: new Date(),
        workoutHistory: []
      }, { merge: true });

      alert("Workout plan selected successfully!");
      navigate("/dashboard"); // Redirect to Dashboard after selection
    } catch (error) {
      console.error("Error saving workout plan:", error);
      alert("Failed to save workout plan. Please try again.");
    }
  };

  // Function to create custom workout plan (can be added later)
  const createCustomWorkout = () => {
    // Navigate to custom workout creation page (to be implemented)
    navigate("/create-workout");
  };

  if (loading) return <div className="loading">Loading workout plans...</div>;

  return (
    <div className="workout-selection-container">
      <h2 className="page-title">Choose Your Workout Plan</h2>
      <p className="selection-description">Select a workout plan that fits your goals and schedule.</p>

      <div className="workout-plans-grid">
        {workoutPlans.map((plan) => (
          <div
            key={plan.id}
            className={`workout-plan-card ${selectedPlanId === plan.id ? 'selected' : ''}`}
            onClick={() => setSelectedPlanId(plan.id)}
          >
            <div className="plan-header">
              <h3 className="plan-name">{plan.name}</h3>
              <input
                type="radio"
                id={plan.id}
                name="workoutPlan"
                value={plan.id}
                checked={selectedPlanId === plan.id}
                onChange={() => setSelectedPlanId(plan.id)}
                className="plan-radio"
              />
            </div>

            <p className="plan-description">{plan.description}</p>

            {plan.days && (
              <div className="plan-details">
                <h4>Schedule:</h4>
                <ul className="days-list">
                  {Object.entries(plan.days).map(([day, exercises]) => (
                    <li key={day}>
                      <strong>{day}:</strong>
                      <span className="exercise-count">{exercises.length} exercises</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedPlanId && (
        <div className="selected-plan-details">
          <h3>Selected Plan Details</h3>
          {(() => {
            const plan = workoutPlans.find(p => p.id === selectedPlanId);
            if (!plan) return null;

            return (
              <div className="workout-details">
                <h4>Exercises by Day:</h4>
                {Object.entries(plan.days).map(([day, exercises]) => (
                  <details key={day} className="day-detail">
                    <summary>{day}</summary>
                    <ul className="exercise-list">
                      {exercises.map((exercise, idx) => (
                        <li key={idx}>{exercise}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      <div className="buttons-container">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          Cancel
        </button>
        <button
          className="confirm-btn"
          onClick={handleSelectPlan}
          disabled={!selectedPlanId}
        >
          Confirm Plan
        </button>
      </div>
    </div>
  );
};

export default WorkoutSelection;