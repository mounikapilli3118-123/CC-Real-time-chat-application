import { auth, database } from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    ref,
    set
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


const registerBtn = document.getElementById("registerBtn");

registerBtn.addEventListener("click", async () => {

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const message = document.getElementById("message");


    if (name === "" || email === "" || password === "") {

        message.textContent = "Please fill all fields.";

        return;
    }


    if (password.length < 6) {

        message.textContent = "Password must contain at least 6 characters.";

        return;
    }


    try {

        // Create user in Firebase Authentication
        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user = userCredential.user;


        // Save user information in Realtime Database
        await set(
            ref(database, "users/" + user.uid),
            {
                name: name,
                email: email,
                uid: user.uid
            }
        );


        message.textContent =
            "Registration successful!";


        setTimeout(() => {

            window.location.href = "login.html";

        }, 1500);


    } catch (error) {

        console.error(error);

        message.textContent = error.message;

    }

});