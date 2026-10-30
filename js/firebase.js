import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { getDatabase } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDy6LPl2bRDI1Z00RlGnvEujRK2PX5f4fg",
    authDomain: "realtimechatapp-1c389.firebaseapp.com",
    databaseURL: "https://realtimechatapp-1c389-default-rtdb.firebaseio.com",
    projectId: "realtimechatapp-1c389",
    storageBucket: "realtimechatapp-1c389.firebasestorage.app",
    messagingSenderId: "175854157626",
    appId: "1:175854157626:web:c07ee024421a44748a9a03"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Firebase Realtime Database
export const database = getDatabase(app);

// Firebase Storage for file and image sharing
export const storage = getStorage(app);
