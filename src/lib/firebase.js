import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB8QQMxxZgNNsU4KFjHXd9EWqSuXdfw39E",
  authDomain: "sellowl-auth.firebaseapp.com",
  projectId: "sellowl-auth",
  storageBucket: "sellowl-auth.firebasestorage.app",
  messagingSenderId: "499800174828",
  appId: "1:499800174828:web:96f12f72769b7ff73c35c9",
  measurementId: "G-R7Z576DMQY",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
