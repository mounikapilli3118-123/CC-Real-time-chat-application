
import { auth, database } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    ref,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

console.log("NOTIFICATIONS JS WORKING");

const notificationsDiv = document.getElementById("notifications");
const clearBtn = document.getElementById("clearBtn");

let allNotificationsRef = null;
let unsubscribeNotifications = null;

// Check logged-in user
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    console.log("Logged-in email:", user.email);
    console.log("Logged-in UID:", user.uid);

    loadNotifications();
});

// Load notifications from the complete notifications node
function loadNotifications() {
    allNotificationsRef = ref(database, "notifications");

    console.log("Reading database path: notifications");

    if (unsubscribeNotifications) {
        unsubscribeNotifications();
    }

    unsubscribeNotifications = onValue(
        allNotificationsRef,
        (snapshot) => {
            notificationsDiv.innerHTML = "";

            const data = snapshot.val();

            console.log("ALL NOTIFICATIONS:", data);

            if (!data) {
                notificationsDiv.textContent =
                    "No notifications found in Firebase.";
                return;
            }

            const notificationList = [];

            // Each first-level key is a user's UID
            Object.entries(data).forEach(([userId, userNotifications]) => {
                if (!userNotifications || typeof userNotifications !== "object") {
                    return;
                }

                Object.entries(userNotifications).forEach(
                    ([notificationId, notification]) => {
                        if (!notification || typeof notification !== "object") {
                            return;
                        }

                        notificationList.push({
                            id: notificationId,
                            recipientId: userId,
                            ...notification
                        });
                    }
                );
            });

            notificationList.sort(
                (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
            );

            if (notificationList.length === 0) {
                notificationsDiv.textContent =
                    "No notification records found.";
                return;
            }

            notificationList.forEach((notification) => {
                const card = document.createElement("div");
                card.className = "notification";

                const heading = document.createElement("h3");
                heading.textContent =
                    "🔔 " +
                    (
                        notification.senderName ||
                        notification.title ||
                        "New Notification"
                    );

                const message = document.createElement("p");
                message.textContent =
                    notification.messagePreview ||
                    notification.message ||
                    notification.text ||
                    "You have a new notification.";

                const time = document.createElement("small");
                time.textContent = notification.timestamp
                    ? new Date(notification.timestamp).toLocaleString()
                    : "";

                card.appendChild(heading);
                card.appendChild(message);
                card.appendChild(time);

                notificationsDiv.appendChild(card);
            });
        },
        (error) => {
            console.error("Notification loading error:", error);

            notificationsDiv.textContent =
                "Unable to load notifications: " + error.message;
        }
    );
}

// Clear all notifications (testing version)
if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
        const user = auth.currentUser;

        if (!user) {
            alert("Please log in first.");
            return;
        }

        const confirmed = confirm(
            "This will delete notifications for ALL users. Continue?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await remove(ref(database, "notifications"));
            console.log("All notifications cleared.");
        } catch (error) {
            console.error("Clear notifications error:", error);
            alert("Unable to clear notifications: " + error.message);
        }
    });
}
