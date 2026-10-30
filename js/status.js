import { auth, database } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    ref,
    onValue,
    set,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

console.log("STATUS JS LOADED");

onAuthStateChanged(auth, (user) => {

    if (!user) {
        console.log("No user logged in");
        return;
    }

    console.log("Logged in:", user.email);

    const statusRef =
        ref(database, "status/" + user.uid);

    const connectedRef =
        ref(database, ".info/connected");

    onValue(connectedRef, (snapshot) => {

        const connected = snapshot.val();

        console.log("Firebase connected:", connected);

        if (connected !== true) {
            return;
        }

        // Set OFFLINE when connection is lost
        onDisconnect(statusRef)
            .set({
                state: "offline",
                email: user.email
            })
            .then(() => {

                // Set ONLINE while connected
                return set(statusRef, {
                    state: "online",
                    email: user.email
                });

            })
            .then(() => {
                console.log("STATUS: ONLINE");
            })
            .catch((error) => {
                console.error(
                    "STATUS ERROR:",
                    error
                );
            });
    });
});