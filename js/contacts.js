import { auth, database } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";


const contactsList =
    document.getElementById("contactsList");


onAuthStateChanged(auth, (currentUser) => {

    if (!currentUser) {

        window.location.href = "login.html";

        return;
    }


    const usersRef =
        ref(database, "users");


    onValue(usersRef, (snapshot) => {

        contactsList.innerHTML = "";


        snapshot.forEach((childSnapshot) => {

            const user =
                childSnapshot.val();


            // Don't show the currently logged-in user
            if (user.uid === currentUser.uid) {
                return;
            }


            const div =
                document.createElement("div");

            div.className = "contact";


            div.innerHTML = `
                <h3>👤 ${user.name}</h3>
                <p>${user.email}</p>
                <p>🟢 Registered User</p>
            `;


            contactsList.appendChild(div);

        });

    });

});