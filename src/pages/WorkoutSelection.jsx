import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { firestore } from "../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";  // ✅ Import getDoc
import { useNavigate } from "react-router-dom";

// ✅ Available workout plans (Hardcoded, but should ideally be stored in Firestore)
const workoutPlans = [
  { id: "push_pull_legs", name: "Push Pull Legs", description: "A balanced workout focusing on pushing, pulling, and leg days." },
  { id: "full_body", name: "Full Body", description: "A full-body workout for each session." },
  { id: "upper_lower", name: "Upper Lower Split", description: "Splits workout into upper and lower body days." },
];

const WorkoutSelection = () => {
  const { user } = useContext(AuthContext);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const navigate = useNavigate();

  const handleSelectPlan = async () => {
    if (!selectedPlanId) return alert("Please select a workout plan!");

    try {
      // ✅ Try to fetch the selected workout plan from Firestore
      const workoutRef = doc(firestore, "workouts", selectedPlanId);
      const workoutDoc = await getDoc(workoutRef);

      let workoutData;
      if (workoutDoc.exists()) {
        workoutData = { id: selectedPlanId, ...workoutDoc.data() };
      } else {
        // ✅ Fallback to hardcoded workout plans if not found in Firestore
        workoutData = workoutPlans.find(plan => plan.id === selectedPlanId);
        if (!workoutData) {
          alert("Workout plan not found.");
          return;
        }
      }

      // ✅ Store the selected plan inside the user's document
      const userRef = doc(firestore, "users", user.uid);
      await setDoc(userRef, { workoutPlan: workoutData }, { merge: true });

      navigate("/dashboard"); // ✅ Redirect to Dashboard after selection
    } catch (error) {
      console.error("Error saving workout plan:", error);
      alert("Failed to save workout plan. Please try again.");
    }
  };

  return (
    <div>
      <h2>Select Your Workout Plan</h2>
      {workoutPlans.map((plan) => (
        <div key={plan.id}>
          <input
            type="radio"
            id={plan.id}
            name="workoutPlan"
            value={plan.id}
            checked={selectedPlanId === plan.id}
            onChange={() => setSelectedPlanId(plan.id)}
          />
          <label htmlFor={plan.id}>{plan.name} - {plan.description}</label>
        </div>
      ))}
      <button onClick={handleSelectPlan}>Confirm Plan</button>
    </div>
  );
};

export default WorkoutSelection;
