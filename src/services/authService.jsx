import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, firestore } from '../firebase/firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";

// ✅ Fix: Properly handle authentication state changes
const checkAuthState = (setUser) => {
  return onAuthStateChanged(auth, (user) => {
    setUser(user);
  });
};

// ✅ Sign Up (Registers user and initializes Firestore entry)
const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User signed up:', user);

    // ✅ Initialize Firestore user document
    const userDocRef = doc(firestore, "users", user.uid);
    await setDoc(userDocRef, {
      email: user.email,
      workoutPlan: null, // No default workout plan
      createdAt: new Date()
    });

    return user;
  } catch (error) {
    console.error('Error signing up:', error.message);
    throw error;
  }
};

// ✅ Login (No unnecessary localStorage usage)
const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error.message);
    throw error;
  }
};

// ✅ Log Out (Removes user from state)
const logout = async () => {
  try {
    await signOut(auth);
    console.log('User logged out');
  } catch (error) {
    console.error('Error logging out:', error.message);
  }
};

export { signUp, login, logout, checkAuthState };
