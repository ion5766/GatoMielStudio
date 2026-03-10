// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiJkhAd08hv_fjqGMYOvr-vYXudlj5aSs",
  authDomain: "gato-miel-estudio.firebaseapp.com",
  projectId: "gato-miel-estudio",
  storageBucket: "gato-miel-estudio.firebasestorage.app",
  messagingSenderId: "150671559458",
  appId: "1:150671559458:web:6daaf4a78150706db0337b",
  measurementId: "G-PL79FSGHX5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;
