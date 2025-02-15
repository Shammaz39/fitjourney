// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "apiKey" : "AIzaSyAN1_UFSC9rn1Zq0MiugMForAw48-nZY-8",
  "authDomain" : "fitjourney-18a79.firebaseapp.com",
  "projectId": "fitjourney-18a79",
  "storageBucket": "fitjourney-18a79.firebasestorage.app",
  "messagingSenderId": "208932833920",
  "appId": "1:208932833920:web:f3d2d12db1fb3e5567f465",
  "measurementId": "G-3M5MWR8XZ1"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and Firestore
const auth = getAuth(app);
const firestore = getFirestore(app);

// Sign-up function
export const signUp = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Login function
export const login = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Logout function
export const logout = () => {
  return signOut(auth);
};

export { auth, firestore };
