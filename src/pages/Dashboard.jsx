import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/firebase";

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

 return (
   <div>
     <h2>Welcome to Dashboard</h2>
     <p>User: {user.email}</p>

     {selectedWorkout ? (
       <>
         <h3>Your Selected Workout Plan: {selectedWorkout.name || "Unnamed Plan"}</h3>
         <p>{selectedWorkout.description || "No description available"}</p>

         {/* Check if 'days' exists before rendering */}
         {selectedWorkout.days ? (
           <ul>
             {Object.entries(selectedWorkout.days).map(([day, routine]) => (
               <li key={day}>
                 <strong>{day}:</strong> {routine}
               </li>
             ))}
           </ul>
         ) : (
           <p>No exercises assigned to this plan.</p>
         )}

         <button onClick={() => navigate("/select-workout")}>Change Workout Plan</button>
       </>
     ) : (
       <>
         <p>No workout selected. Choose a plan.</p>
         <button onClick={() => navigate("/select-workout")}>Select Workout Plan</button>
       </>
     )}

     <h3>Available Workout Plans</h3>
     {allWorkouts.length > 0 ? (
       <ul>
         {allWorkouts.map(workout => (
           <li key={workout.id}>
             <strong>{workout.name}</strong> - {workout.description || "No description available"}
           </li>
         ))}
       </ul>
     ) : (
       <p>No workout plans available.</p>
     )}
<button onClick={() => navigate("/log-workout")}>Log Today's Workout</button>

     <button onClick={handleLogout}>Logout</button>
   </div>
 );

};

export default Dashboard;
