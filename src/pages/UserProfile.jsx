import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { firestore } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/UserProfile.css"; // You'll need to create this CSS file

const UserProfile = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [profile, setProfile] = useState({
    displayName: "",
    height: "",
    weight: "",
    birthdate: "",
    fitnessGoals: [],
    fitnessLevel: "Beginner"
  });

  const [measurements, setMeasurements] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: "",
    chest: "",
    waist: "",
    hips: "",
    arms: "",
    thighs: ""
  });

  // Available options
  const fitnessGoalOptions = [
    "Build muscle",
    "Lose weight",
    "Improve strength",
    "Increase endurance",
    "Improve flexibility",
    "Better overall health"
  ];

  const fitnessLevelOptions = [
    "Beginner",
    "Intermediate",
    "Advanced"
  ];

  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Load profile data if it exists
          if (userData.profileInfo) {
            setProfile({
              displayName: userData.displayName || "",
              height: userData.profileInfo.height || "",
              weight: userData.profileInfo.weight || "",
              birthdate: userData.profileInfo.birthdate || "",
              fitnessGoals: userData.profileInfo.fitnessGoals || [],
              fitnessLevel: userData.profileInfo.fitnessLevel || "Beginner"
            });
          }

          // Load latest measurement if exists
          if (userData.bodyMeasurements && userData.bodyMeasurements.length > 0) {
            const latestMeasurement = userData.bodyMeasurements[userData.bodyMeasurements.length - 1];
            setMeasurements({
              date: new Date().toISOString().split('T')[0], // Always set today's date for new measurements
              weight: latestMeasurement.weight || "",
              chest: latestMeasurement.measurements?.chest || "",
              waist: latestMeasurement.measurements?.waist || "",
              hips: latestMeasurement.measurements?.hips || "",
              arms: latestMeasurement.measurements?.arms || "",
              thighs: latestMeasurement.measurements?.thighs || ""
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoalToggle = (goal) => {
    setProfile(prev => {
      const currentGoals = [...prev.fitnessGoals];
      if (currentGoals.includes(goal)) {
        return {
          ...prev,
          fitnessGoals: currentGoals.filter(g => g !== goal)
        };
      } else {
        return {
          ...prev,
          fitnessGoals: [...currentGoals, goal]
        };
      }
    });
  };

  const handleMeasurementChange = (e) => {
    const { name, value } = e.target;
    setMeasurements(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const userDocRef = doc(firestore, "users", user.uid);

      // Get current user data
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Save profile information
      await updateDoc(userDocRef, {
        displayName: profile.displayName,
        profileInfo: {
          height: profile.height,
          weight: profile.weight,
          birthdate: profile.birthdate,
          fitnessGoals: profile.fitnessGoals,
          fitnessLevel: profile.fitnessLevel
        }
      });

      alert("Profile updated successfully!");
      setSaving(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
      setSaving(false);
    }
  };

  const saveMeasurement = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const userDocRef = doc(firestore, "users", user.uid);

      // Get current user data
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Prepare new measurement entry
      const newMeasurement = {
        date: measurements.date,
        weight: measurements.weight,
        measurements: {
          chest: measurements.chest,
          waist: measurements.waist,
          hips: measurements.hips,
          arms: measurements.arms,
          thighs: measurements.thighs
        }
      };

      // Add to existing measurements or create new array
      const bodyMeasurements = userData.bodyMeasurements || [];
      bodyMeasurements.push(newMeasurement);

      await updateDoc(userDocRef, {
        bodyMeasurements: bodyMeasurements
      });

      alert("Measurements saved successfully!");
      setSaving(false);
    } catch (error) {
      console.error("Error saving measurements:", error);
      alert("Failed to save measurements. Please try again.");
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      <h2 className="page-title">Your Profile</h2>

      <div className="profile-section">
        <h3>Personal Information</h3>
        <div className="form-group">
          <label htmlFor="displayName">Name</label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={profile.displayName}
            onChange={handleProfileChange}
            className="input-field"
            placeholder="Your name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="birthdate">Birth Date</label>
          <input
            type="date"
            id="birthdate"
            name="birthdate"
            value={profile.birthdate}
            onChange={handleProfileChange}
            className="input-field"
          />
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="height">Height (cm)</label>
            <input
              type="number"
              id="height"
              name="height"
              value={profile.height}
              onChange={handleProfileChange}
              className="input-field"
              placeholder="Height in cm"
              min="0"
            />
          </div>

          <div className="form-group half">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={profile.weight}
              onChange={handleProfileChange}
              className="input-field"
              placeholder="Weight in kg"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="fitnessLevel">Fitness Level</label>
          <select
            id="fitnessLevel"
            name="fitnessLevel"
            value={profile.fitnessLevel}
            onChange={handleProfileChange}
            className="select-field"
          >
            {fitnessLevelOptions.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Fitness Goals (select all that apply)</label>
          <div className="checkbox-group">
            {fitnessGoalOptions.map(goal => (
              <div key={goal} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`goal-${goal}`}
                  checked={profile.fitnessGoals.includes(goal)}
                  onChange={() => handleGoalToggle(goal)}
                />
                <label htmlFor={`goal-${goal}`}>{goal}</label>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="save-btn"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      <div className="profile-section">
        <h3>Body Measurements</h3>
        <p className="section-description">Track your progress by regularly updating your measurements.</p>

        <div className="form-group">
          <label htmlFor="measurement-date">Date</label>
          <input
            type="date"
            id="measurement-date"
            name="date"
            value={measurements.date}
            onChange={handleMeasurementChange}
            className="input-field"
          />
        </div>

        <div className="measurements-grid">
          <div className="form-group">
            <label htmlFor="measurement-weight">Weight (kg)</label>
            <input
              type="number"
              id="measurement-weight"
              name="weight"
              value={measurements.weight}
              onChange={handleMeasurementChange}
              className="input-field"
              placeholder="Weight in kg"
              min="0"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurement-chest">Chest (cm)</label>
            <input
              type="number"
              id="measurement-chest"
              name="chest"
              value={measurements.chest}
              onChange={handleMeasurementChange}
              className="input-field"
              placeholder="Chest in cm"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurement-waist">Waist (cm)</label>
            <input
              type="number"
              id="measurement-waist"
              name="waist"
              value={measurements.waist}
              onChange={handleMeasurementChange}
              className="input-field"
              placeholder="Waist in cm"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurement-hips">Hips (cm)</label>
            <input
              type="number"
              id="measurement-hips"
              name="hips"
              value={measurements.hips}
              onChange={handleMeasurementChange}
              className="input-field"
              placeholder="Hips in cm"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurement-arms">Arms (cm)</label>
            <input
              type="number"
              id="measurement-arms"
              name="arms"
              value={measurements.arms}
              onChange={handleMeasurementChange}
              className="input-field"
              placeholder="Arms in cm"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="measurement-thighs">Thighs (cm)</label>
            <input
              type="number"
              id="measurement-thighs"
              name="thighs"
              value={measurements.thighs}
              onChange={handleMeasurementChange}
              className="input-field"
              placeholder="Thighs in cm"
              min="0"
            />
          </div>
        </div>

        <button
          onClick={saveMeasurement}
          disabled={saving}
          className="save-btn"
        >
          {saving ? "Saving..." : "Save Measurements"}
        </button>
      </div>

      <div className="buttons-container">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default UserProfile;