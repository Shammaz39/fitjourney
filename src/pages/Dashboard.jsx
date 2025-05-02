import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import { doc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import '../styles/Dashboard.css';


const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchUserWorkout = async () => {
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.workoutPlan) {
            setSelectedWorkout(userData.workoutPlan);
          } else {
            setSelectedWorkout(null); // Ensure state is cleared if no plan is found
          }
        }
      } catch (error) {
        console.error("Error fetching user workout:", error);
      }
    };

    const fetchAllWorkouts = async () => {
      setLoadingWorkouts(true);
      try {
        const querySnapshot = await getDocs(collection(firestore, "workouts"));
        const workoutList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllWorkouts(workoutList);
      } catch (error) {
        console.error("Error fetching workout plans:", error);
      } finally {
        setLoadingWorkouts(false);
      }
    };

    fetchUserWorkout();
    fetchAllWorkouts();
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Helper function to render routine based on its type
  const renderRoutine = (routine) => {
    if (Array.isArray(routine)) {
      return routine.join(', ');
    } else if (typeof routine === 'object' && routine !== null) {
      // Handle object type (could be exercises with details)
      return Object.entries(routine).map(([exerciseName, details]) => {
        if (typeof details === 'object') {
          // Format exercise details like sets, reps, etc.
          const formattedDetails = Object.entries(details)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          return `${exerciseName} (${formattedDetails})`;
        } else {
          return `${exerciseName}: ${details}`;
        }
      }).join('; ');
    } else {
      // String or other primitive type
      return routine;
    }
  };

  // Function to reset workout plan
  const resetWorkoutPlan = async () => {
    if (!window.confirm("Are you sure you want to reset your workout plan? This can't be undone.")) {
      return;
    }

    try {
      const userRef = doc(firestore, "users", user.uid);

      // Get current user data
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Remove the workout plan but keep other user data
      const { workoutPlan, ...restData } = userData;

      await setDoc(userRef, {
        ...restData,
        lastUpdated: new Date()
      });

      setSelectedWorkout(null);
      alert("Workout plan has been reset successfully.");
    } catch (error) {
      console.error("Error resetting workout plan:", error);
      alert("Failed to reset workout plan. Please try again.");
    }
  };

  // Get today's day name
  const getTodayWorkout = () => {
    if (!selectedWorkout || !selectedWorkout.days) return null;

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];

    // Find a workout that matches today (either exactly or contains today's name)
    const todayKey = Object.keys(selectedWorkout.days).find(day =>
      day === today || day.includes(today)
    );

    if (todayKey) {
      return {
        day: todayKey,
        exercises: selectedWorkout.days[todayKey]
      };
    }

    return null;
  };

  const todayWorkout = getTodayWorkout();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome to Your Fitness Dashboard</h2>
        <p className="dashboard-user">User: {user.email}</p>
      </div>

      {/* Today's Workout Section */}
      <div className="section today-workout">
        <h3>Today's Workout</h3>
        {todayWorkout ? (
          <>
            <h4>{todayWorkout.day}</h4>
            <ul className="exercise-list">
              {Array.isArray(todayWorkout.exercises) ? (
                todayWorkout.exercises.map((exercise, index) => (
                  <li key={index}>{exercise}</li>
                ))
              ) : (
                <li>{renderRoutine(todayWorkout.exercises)}</li>
              )}
            </ul>
            <button
              className="primary-btn"
              onClick={() => navigate("/log-workout", { state: { dayWorkout: todayWorkout } })}
            >
              Start Today's Workout
            </button>
          </>
        ) : (
          <p>No workout scheduled for today or no workout plan selected.</p>
        )}
      </div>

      <div className="section">
        <h3>Your Workout Plan</h3>
        {selectedWorkout ? (
          <>
            <div className="workout-plan-header">
              <h4>{selectedWorkout.name || "Unnamed Plan"}</h4>
              <div className="workout-actions">
                <button className="secondary-btn" onClick={() => navigate("/select-workout")}>
                  Change Plan
                </button>
                <button className="warning-btn" onClick={resetWorkoutPlan}>
                  Reset Plan
                </button>
              </div>
            </div>
            <p className="plan-description">{selectedWorkout.description || "No description available"}</p>
            {selectedWorkout.days ? (
              <div className="workout-days">
                <h4>Weekly Schedule:</h4>
                <ul className="workout-list">
                  {Object.entries(selectedWorkout.days).map(([day, routine]) => (
                    <li key={day}>
                      <strong>{day}:</strong> {renderRoutine(routine)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>No exercises assigned to this plan.</p>
            )}
          </>
        ) : (
          <div className="no-workout-selected">
            <p>You haven't selected a workout plan yet. Choose a plan to get started!</p>
            <button className="primary-btn" onClick={() => navigate("/select-workout")}>
              Select Workout Plan
            </button>
          </div>
        )}
      </div>

      <div className="section quick-stats">
        <h3>Your Progress Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">0</div>
            <div className="stat-label">Workouts Logged</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">0</div>
            <div className="stat-label">Days Streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">0</div>
            <div className="stat-label">Total Weight Lifted</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">0</div>
            <div className="stat-label">Personal Records</div>
          </div>
        </div>
      </div>

      <div className="section available-workouts">
        <h3>Explore Workout Plans</h3>
        {loadingWorkouts ? (
          <p>Loading workouts...</p>
        ) : allWorkouts.length > 0 ? (
          <div className="workout-plans-grid">
            {allWorkouts.slice(0, 3).map((workout) => (
              <div key={workout.id} className="workout-card">
                <h4>{workout.name}</h4>
                <p>{workout.description || "No description available"}</p>
                <button
                  className="text-btn"
                  onClick={() => navigate("/select-workout")}
                >
                  View Details
                </button>
              </div>
            ))}
            {allWorkouts.length > 3 && (
              <button
                className="text-btn see-all"
                onClick={() => navigate("/select-workout")}
              >
                See All Plans
              </button>
            )}
          </div>
        ) : (
          <p>No workout plans available.</p>
        )}
      </div>

      <div className="dashboard-buttons">
        <button className="primary-btn" onClick={() => navigate("/log-workout")}>
          Log Workout
        </button>
        <button className="secondary-btn" onClick={() => navigate("/progress")}>
          View Progress
        </button>
        <button className="secondary-btn" onClick={() => navigate("/profile")}>
          Your Profile
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;