import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from "../context/AuthContext";
import { firestore, storage } from "../firebase/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import '../styles/TransformationGallery.css';

const TransformationGallery = () => {
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.transformationPhotos) {
            // Sort photos by date
            const sortedPhotos = [...userData.transformationPhotos].sort((a, b) =>
              new Date(a.date) - new Date(b.date)
            );
            setPhotos(sortedPhotos);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching photos:", error);
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [user]);

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setNewPhoto(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!newPhoto || !user) return;

    try {
      setUploading(true);

      // Upload photo to Firebase Storage
      const storageRef = ref(storage, `transformationPhotos/${user.uid}/${photoDate}-${newPhoto.name}`);
      await uploadBytes(storageRef, newPhoto);

      // Get the download URL
      const photoURL = await getDownloadURL(storageRef);

      // Add to Firestore
      const userDocRef = doc(firestore, "users", user.uid);

      await updateDoc(userDocRef, {
        transformationPhotos: arrayUnion({
          date: photoDate,
          url: photoURL,
          uploadedAt: new Date().toISOString()
        })
      });

      // Update local state
      setPhotos(prev => [...prev, {
        date: photoDate,
        url: photoURL,
        uploadedAt: new Date().toISOString()
      }].sort((a, b) => new Date(a.date) - new Date(b.date)));

      // Reset form
      setNewPhoto(null);
      document.getElementById('photo-upload').value = '';
      setPhotoDate(new Date().toISOString().split('T')[0]);

      setUploading(false);
      alert("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
      setUploading(false);
    }
  };

  if (loading) return <div className="loading">Loading photo gallery...</div>;

  return (
    <div className="transformation-container">
      <h2 className="page-title">Your Transformation Journey</h2>

      <div className="upload-section">
        <h3>Add New Progress Photo</h3>
        <div className="form-group">
          <label htmlFor="photo-date">Photo Date:</label>
          <input
            type="date"
            id="photo-date"
            value={photoDate}
            onChange={(e) => setPhotoDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="date-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="photo-upload">Select Photo:</label>
          <input
            type="file"
            id="photo-upload"
            accept="image/*"
            onChange={handlePhotoChange}
            className="file-input"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!newPhoto || uploading}
          className="upload-btn"
        >
          {uploading ? "Uploading..." : "Upload Photo"}
        </button>

        <p className="privacy-note">
          Your photos are private and only visible to you.
        </p>
      </div>

      <div className="gallery-section">
        <h3>Your Progress Gallery</h3>

        {photos.length > 0 ? (
          <div className="photo-grid">
            {photos.map((photo, index) => (
              <div key={index} className="photo-card">
                <img src={photo.url} alt={`Progress from ${photo.date}`} className="progress-photo" />
                <div className="photo-info">
                  <p className="photo-date">{new Date(photo.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-photos">
            <p>You haven't uploaded any transformation photos yet.</p>
            <p>Upload your first photo to start tracking your visual progress!</p>
          </div>
        )}
      </div>

      {photos.length >= 2 && (
        <div className="comparison-section">
          <h3>Before & After Comparison</h3>
          <div className="comparison-container">
            <div className="before-photo">
              <h4>Before</h4>
              <img src={photos[0].url} alt={`Before - ${photos[0].date}`} />
              <p>{new Date(photos[0].date).toLocaleDateString()}</p>
            </div>
            <div className="after-photo">
              <h4>Current</h4>
              <img src={photos[photos.length - 1].url} alt={`Current - ${photos[photos.length - 1].date}`} />
              <p>{new Date(photos[photos.length - 1].date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/dashboard")} className="back-btn">
        Back to Dashboard
      </button>
    </div>
  );
};

export default TransformationGallery;