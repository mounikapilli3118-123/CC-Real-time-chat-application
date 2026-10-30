
import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

function showMessage(text, success = false) {
    message.textContent = text;
    message.style.color = success ? "#12805c" : "#d93025";
}

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage("Please enter your email and password.");
            return;
        }

        loginBtn.disabled = true;
        showMessage("Signing in...", true);

        try {
            await signInWithEmailAndPassword(auth, email, password);

            showMessage("Login successful! Opening dashboard...", true);

            window.location.href = "index.html";
        } catch (error) {
            console.error("Login error:", error);

            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/wrong-password" ||
                error.code === "auth/user-not-found"
            ) {
                showMessage("Incorrect email or password. Please try again.");
            } else if (error.code === "auth/invalid-email") {
                showMessage("Please enter a valid email address.");
            } else if (error.code === "auth/too-many-requests") {
                showMessage("Too many attempts. Please try again later.");
            } else if (error.code === "auth/network-request-failed") {
                showMessage("Network error. Check your internet connection.");
            } else {
                showMessage("Login failed: " + error.message);
            }
        } finally {
            loginBtn.disabled = false;
        }
    });
}
