
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "ruet-connect",
  "appId": "1:828695381137:web:4837bf324f65de6b426b30",
  "storageBucket": "ruet-connect.firebasestorage.app",
  "apiKey": "AIzaSyAUQCsiqPhRbNF_wTJCYPhCE_PI0MaEGNc",
  "authDomain": "ruet-connect.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "828695381137"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const storage = getStorage(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
