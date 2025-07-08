import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "YOUR API KEY",
    authDomain: "YOUR FIREBASE DOMAIN",
    projectId: "ID",
    storageBucket: "STORAGE ID",
    messagingSenderId: "ID",
    appId: "APP ID",
    measurementId: "ID",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore, signInAnonymously };
