import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAwdi3Iw2Qo5ES1BEmHR8-8adsqOO4Om4E",
    authDomain: "fanday-6370e.firebaseapp.com",
    projectId: "fanday-6370e",
    storageBucket: "fanday-6370e.firebasestorage.app",
    messagingSenderId: "822870332363",
    appId: "1:822870332363:web:354efd0437f90b0d631c4e",
    measurementId: "G-M9PXN77EHD"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
