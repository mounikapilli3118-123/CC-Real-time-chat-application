import { auth } from "./firebase.js";

import {
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const emailInput = document.getElementById("email");
const resetBtn = document.getElementById("resetBtn");
const message = document.getElementById("message");

resetBtn.addEventListener("click", async () => {

    const email = emailInput.value.trim();

    if (email === "") {
        message.textContent = "Please enter your email.";
        message.style.color = "red";
        return;
    }

    console.log("Sending reset email to:", email);

    try {

        await sendPasswordResetEmail(auth, email);

        console.log("RESET EMAIL SENT");

        message.textContent =
            "Reset email sent successfully. Check Inbox and Spam.";

        message.style.color = "green";

    } catch (error) {

        console.error("RESET ERROR CODE:", error.code);
        console.error("RESET ERROR MESSAGE:", error.message);

        message.textContent =
            error.code + " - " + error.message;

        message.style.color = "red";
    }
});