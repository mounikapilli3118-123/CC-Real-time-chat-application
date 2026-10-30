import { auth } from "./firebase.js";

import {
    verifyPasswordResetCode,
    confirmPasswordReset
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const newPassword =
    document.getElementById("newPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const resetBtn =
    document.getElementById("resetBtn");

const message =
    document.getElementById("message");


const urlParams =
    new URLSearchParams(
        window.location.search
    );

const oobCode =
    urlParams.get("oobCode");


if (!oobCode) {

    message.textContent =
        "Invalid or expired reset link.";

    message.style.color = "red";

    resetBtn.disabled = true;
}


resetBtn.addEventListener(
    "click",
    async () => {

        const password =
            newPassword.value.trim();

        const confirm =
            confirmPassword.value.trim();


        if (password === "") {

            message.textContent =
                "Please enter a new password.";

            message.style.color = "red";

            return;
        }


        if (password.length < 6) {

            message.textContent =
                "Password must be at least 6 characters.";

            message.style.color = "red";

            return;
        }


        if (password !== confirm) {

            message.textContent =
                "Passwords do not match.";

            message.style.color = "red";

            return;
        }


        try {

            await verifyPasswordResetCode(
                auth,
                oobCode
            );


            await confirmPasswordReset(
                auth,
                oobCode,
                password
            );


            message.textContent =
                "Password reset successfully!";

            message.style.color = "green";


            newPassword.value = "";

            confirmPassword.value = "";


            setTimeout(() => {

                window.location.href =
                    "login.html";

            }, 2000);


        } catch (error) {

            console.error(
                "PASSWORD RESET ERROR:",
                error
            );


            message.textContent =
                "Reset link is invalid or expired.";

            message.style.color = "red";

        }

    }
);