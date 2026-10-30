import { auth, database } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const userEmail =
    document.getElementById("userEmail");

const usersList =
    document.getElementById("usersList");


onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    userEmail.textContent = user.email;

    loadUsers(user.uid);
});


function loadUsers(currentUid) {

    const usersRef =
        ref(database, "users");

    onValue(usersRef, (snapshot) => {

        usersList.innerHTML = "";

        const users = snapshot.val();

        if (!users) {
            usersList.innerHTML =
                "<p>No users found.</p>";
            return;
        }

        let count = 0;

        Object.entries(users).forEach(
            ([uid, userData]) => {

                // Don't show current user
                if (uid === currentUid) {
                    return;
                }

                count++;

                const userDiv =
                    document.createElement("div");

                userDiv.className = "chat-item";

                userDiv.innerHTML = `
                    <div class="avatar">
                        👤
                    </div>

                    <div class="user-info">

                        <h3>
                            ${userData.name || "User"}
                        </h3>

                        <p>
                            ${userData.email || ""}
                        </p>

                        <p id="status-${uid}"
                           class="user-status">
                            🔴 Offline
                        </p>

                    </div>

                    <a href="messages.html?uid=${uid}">
    Chat
</a>
                `;

                usersList.appendChild(userDiv);

                watchUserStatus(uid);
            }
        );

        if (count === 0) {

            usersList.innerHTML =
                "<p>No other users found.</p>";
        }
    });
}


function watchUserStatus(uid) {

    const statusRef =
        ref(database, "status/" + uid);

    onValue(statusRef, (snapshot) => {

        const statusElement =
            document.getElementById("status-" + uid);

        if (!statusElement) {
            return;
        }

        const statusData =
            snapshot.val();

        console.log(
            "Status for",
            uid,
            ":",
            statusData
        );

        if (
            statusData &&
            statusData.state === "online"
        ) {

            statusElement.textContent =
                "🟢 Online";

        } else {

            statusElement.textContent =
                "🔴 Offline";
        }
    });
}