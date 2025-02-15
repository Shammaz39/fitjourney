import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

// Function to check if user is logged in and persist state
const checkAuthState = (setUser) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user)); // ✅ Store user in LocalStorage
    } else {
      setUser(null);
      localStorage.removeItem('user'); // ✅ Remove user on logout
    }
  });
};

// Sign Up
const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User signed up:', userCredential.user);
    localStorage.setItem('user', JSON.stringify(userCredential.user)); // ✅ Persist user
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up:', error.message);
    throw error;
  }
};

// Login
const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', userCredential.user);
    localStorage.setItem('user', JSON.stringify(userCredential.user)); // ✅ Persist user
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error.message);
    throw error;
  }
};

// Log Out
const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('user'); // ✅ Clear user on logout
    console.log('User logged out');
  } catch (error) {
    console.error('Error logging out:', error.message);
  }
};

export { signUp, login, logout, checkAuthState };
