import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const userEmail =
    document.getElementById("userEmail");

const notificationToggle =
    document.getElementById("notificationToggle");

const logoutBtn =
    document.getElementById("logoutBtn");


// Check logged-in user
onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }

    // Display email
    userEmail.textContent =
        user.email;

});


// Notification setting
notificationToggle.addEventListener(
    "change",
    () => {

        if (notificationToggle.checked) {

            console.log(
                "Notifications Enabled"
            );

        } else {

            console.log(
                "Notifications Disabled"
            );

        }

    }
);


// Logout
logoutBtn.addEventListener(
    "click",
    async () => {

        await signOut(auth);

        window.location.href =
            "login.html";

    }
);