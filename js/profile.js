import { auth, database } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    ref,
    update
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


// Get HTML elements
const userName =
    document.getElementById("userName");

const userEmail =
    document.getElementById("userEmail");

const userId =
    document.getElementById("userId");

const nameInput =
    document.getElementById("nameInput");

const saveBtn =
    document.getElementById("saveBtn");

const message =
    document.getElementById("message");

const logoutBtn =
    document.getElementById("logoutBtn");


let currentUser = null;


// Check logged-in user
onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }

    currentUser = user;

    // Show email
    userEmail.textContent =
        user.email;

    // Show Firebase UID
    userId.textContent =
        user.uid;

    // Show current name
    userName.textContent =
        user.email.split("@")[0];

    // Put current name inside input
    nameInput.value =
        user.email.split("@")[0];

});


// Save new name
saveBtn.addEventListener("click", async () => {

    const newName =
        nameInput.value.trim();

    // Check empty name
    if (newName === "") {

        message.textContent =
            "Please enter your name.";

        return;
    }


    try {

        // Update user name in Firebase
        await update(
            ref(
                database,
                "users/" + currentUser.uid
            ),
            {
                name: newName
            }
        );


        // Update page
        userName.textContent =
            newName;


        message.textContent =
            "Profile updated successfully!";

    } catch (error) {

        console.error(error);

        message.textContent =
            "Error updating profile.";

    }

});


// Logout
logoutBtn.addEventListener(
    "click",
    async () => {

        await signOut(auth);

        window.location.href =
            "login.html";

    }
);