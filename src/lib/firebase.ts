// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "ruet-connect",
  appId: "1:828695381137:web:4837bf324f65de6b426b30",
  storageBucket: "ruet-connect.firebasestorage.app",
  apiKey: "AIzaSyAUQCsiqPhRbNF_wTJCYPhCE_PI0MaEGNc",
  authDomain: "ruet-connect.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "828695381137"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
