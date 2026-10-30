import { auth, database } from "./firebase.js";

import {
    ref,
    push,
    set,
    get,
    remove,
    onValue,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// =====================================
// HTML ELEMENTS
// =====================================

const $ = id => document.getElementById(id);

const usersDiv = $("users");
const userSearch = $("userSearch");
const selectedTitle = $("selectedUser");
const chatStatus = $("chatStatus");
const messagesDiv = $("messages");
const messageInput = $("messageInput");
const sendBtn = $("sendBtn");
const messageSearch = $("messageSearch");
const clearSearchBtn = $("clearSearchBtn");
const clearChatBtn = $("clearChatBtn");
const moreBtn = $("moreBtn");
const moreMenu = $("moreMenu");
const typingStatus = $("typingStatus");
const emojiBtn = $("emojiBtn");
const emojiPicker = $("emojiPicker");
const attachBtn = $("attachBtn");
const fileInput = $("fileInput");
const logoutBtn = $("logoutBtn");
const statusMessage = $("statusMessage");

// =====================================
// VARIABLES
// =====================================

let currentUser = null;
let selectedUser = null;
let usersCache = {};
let messagesCache = {};

let stopUsers = null;
let stopMessages = null;
let stopStatus = null;
let stopTyping = null;
let stopConnection = null;
let stopOwnTyping = null;

let presenceListeners = [];
let typingTimeout = null;

// =====================================
// HELPER FUNCTIONS
// =====================================

function chatId(uid1, uid2) {
    return [uid1, uid2].sort().join("_");
}

function showStatus(message) {
    if (statusMessage) {
        statusMessage.textContent = message;
    }
}

function formatTime(timestamp) {
    if (!timestamp) return "";

    return new Date(timestamp).toLocaleString([], {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// =====================================
// GET ACTUAL USER NAME FROM DATABASE
// =====================================

async function getCurrentUserName() {
    const savedUser = usersCache[currentUser.uid];

    if (savedUser?.name) {
        return savedUser.name;
    }

    if (savedUser?.displayName) {
        return savedUser.displayName;
    }

    try {
        const snapshot = await get(
            ref(database, `users/${currentUser.uid}`)
        );

        if (snapshot.exists()) {
            const userData = snapshot.val();

            return (
                userData.name ||
                userData.displayName ||
                userData.email?.split("@")[0] ||
                currentUser.email?.split("@")[0] ||
                "User"
            );
        }
    } catch (error) {
        console.error("Getting username failed:", error);
    }

    return (
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "User"
    );
}

// =====================================
// CHECK LOGIN
// =====================================

onAuthStateChanged(auth, user => {
    if (!user) {
        location.href = "./login.html";
        return;
    }

    currentUser = user;

    setPresence();
    loadContacts();
});

// =====================================
// ONLINE / OFFLINE STATUS
// =====================================

function setPresence() {
    const ownStatusRef = ref(
        database,
        `status/${currentUser.uid}`
    );

    stopConnection = onValue(
        ref(database, ".info/connected"),
        async snapshot => {
            if (snapshot.val() !== true) return;

            try {
                await onDisconnect(ownStatusRef).set({
                    state: "offline",
                    email: currentUser.email
                });

                await set(ownStatusRef, {
                    state: "online",
                    email: currentUser.email
                });

            } catch (error) {
                console.error("Presence error:", error);
                showStatus("Unable to update online status.");
            }
        }
    );
}

// =====================================
// LOAD CONTACTS
// =====================================

function loadContacts() {
    usersDiv.textContent = "Loading contacts...";

    if (stopUsers) stopUsers();

    stopUsers = onValue(
        ref(database, "users"),
        snapshot => {
            usersCache = snapshot.val() || {};
            renderContacts();

            if (Object.keys(usersCache).length === 0) {
                usersDiv.textContent =
                    "No users found. Check the Firebase users path.";
            }
        },
        error => {
            console.error("Loading contacts failed:", error);
            usersDiv.textContent =
                "Unable to load contacts: " + error.message;
        }
    );
}

// =====================================
// DISPLAY CONTACTS
// =====================================

function renderContacts() {
    presenceListeners.forEach(stop => stop());
    presenceListeners = [];

    usersDiv.innerHTML = "";

    const search = userSearch.value.trim().toLowerCase();

    const contacts = Object.entries(usersCache).filter(
        ([uid, user]) => {
            if (uid === currentUser.uid) return false;

            const name =
                user.name ||
                user.displayName ||
                user.email?.split("@")[0] ||
                "User";

            const details = `${name} ${user.email || ""}`;

            return details.toLowerCase().includes(search);
        }
    );

    if (contacts.length === 0) {
        usersDiv.textContent = "No contacts found.";
        return;
    }

    contacts.forEach(([uid, user]) => {
        const name =
            user.name ||
            user.displayName ||
            user.email?.split("@")[0] ||
            "User";

        const card = document.createElement("div");
        card.className = "contact-card";

        if (selectedUser?.uid === uid) {
            card.classList.add("active");
        }

        const heading = document.createElement("h3");
        heading.textContent = "👤 " + name;

        const email = document.createElement("p");
        email.textContent = user.email || "";

        const online = document.createElement("p");
        online.className = "contact-status";
        online.textContent = "⚫ Offline";

        card.append(heading, email, online);
        usersDiv.appendChild(card);

        const stopPresence = onValue(
            ref(database, `status/${uid}`),
            statusSnapshot => {
                const isOnline =
                    statusSnapshot.val()?.state === "online";

                online.textContent = isOnline
                    ? "🟢 Online"
                    : "⚫ Offline";
            }
        );

        presenceListeners.push(stopPresence);

        card.addEventListener("click", () => {
            selectedUser = {
                uid,
                name,
                email: user.email || ""
            };

            renderContacts();
            openChat();
        });
    });
}

userSearch.addEventListener("input", renderContacts);

// =====================================
// SELECT CONTACT AND OPEN CHAT
// =====================================

function openChat() {
    if (stopMessages) stopMessages();
    if (stopStatus) stopStatus();
    if (stopTyping) stopTyping();

    messagesCache = {};
    messagesDiv.innerHTML = "";

    selectedTitle.textContent = selectedUser.name;
    chatStatus.textContent = "⚫ Offline";
    typingStatus.textContent = "";

    messageSearch.value = "";

    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageSearch.disabled = false;
    emojiBtn.disabled = false;
    attachBtn.disabled = false;

    messageInput.placeholder = "Type a message...";

    stopStatus = onValue(
        ref(database, `status/${selectedUser.uid}`),
        snapshot => {
            chatStatus.textContent =
                snapshot.val()?.state === "online"
                    ? "🟢 Online"
                    : "⚫ Offline";
        }
    );

    const id = chatId(
        currentUser.uid,
        selectedUser.uid
    );

    stopMessages = onValue(
        ref(database, `messages/${id}`),
        snapshot => {
            messagesCache = snapshot.val() || {};
            renderMessages();
        },
        error => {
            console.error("Messages error:", error);
            showStatus("Unable to load messages: " + error.message);
        }
    );

    stopTyping = onValue(
        ref(
            database,
            `typing/${selectedUser.uid}/${currentUser.uid}`
        ),
        snapshot => {
            typingStatus.textContent = snapshot.val()
                ? `✍️ ${selectedUser.name} is typing...`
                : "";
        }
    );
}

// =====================================
// DISPLAY MESSAGES
// =====================================

function renderMessages() {
    messagesDiv.innerHTML = "";

    const search = messageSearch.value
        .trim()
        .toLowerCase();

    const entries = Object.entries(messagesCache)
        .filter(([, message]) =>
            (message.text || "").toLowerCase().includes(search)
        )
        .sort((a, b) =>
            (a[1].timestamp || 0) - (b[1].timestamp || 0)
        );

    if (entries.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-message";

        empty.textContent = search
            ? "No matching messages found."
            : "No messages yet. Start chatting!";

        messagesDiv.appendChild(empty);
        return;
    }

    entries.forEach(([messageId, message]) => {
        const isMine =
            message.senderId === currentUser.uid;

        const row = document.createElement("div");
        row.className = isMine
            ? "message-row sent"
            : "message-row received";

        const card = document.createElement("div");
        card.className = "message-card";

        const sender = document.createElement("small");
        sender.className = "message-sender";
        sender.textContent = isMine
            ? "You"
            : (message.senderName || selectedUser.name);

        const text = document.createElement("p");
        text.className = "message-text";
        text.textContent = message.text || "";

        const time = document.createElement("small");
        time.className = "message-time";
        time.textContent = formatTime(message.timestamp);

        card.append(sender, text, time);
        row.appendChild(card);

        const actions = document.createElement("div");
        actions.className = "message-actions";

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.textContent = "📋 Copy";

        copyBtn.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(
                    message.text || ""
                );
                showStatus("Message copied.");
            } catch (error) {
                console.error(error);
                showStatus("Could not copy message.");
            }
        });

        actions.appendChild(copyBtn);

        if (isMine) {
            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.textContent = "🗑️ Delete";

            deleteBtn.addEventListener("click", async () => {
                if (!selectedUser) return;

                try {
                    await remove(
                        ref(
                            database,
                            `messages/${chatId(
                                currentUser.uid,
                                selectedUser.uid
                            )}/${messageId}`
                        )
                    );

                    showStatus("Message deleted.");
                } catch (error) {
                    console.error(error);
                    showStatus("Could not delete message.");
                }
            });

            actions.appendChild(deleteBtn);
        }

        row.appendChild(actions);
        messagesDiv.appendChild(row);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// =====================================
// SEARCH MESSAGES
// =====================================

messageSearch.addEventListener("input", renderMessages);

clearSearchBtn.addEventListener("click", () => {
    messageSearch.value = "";
    renderMessages();
});

// =====================================
// SEND MESSAGE + NOTIFICATION
// =====================================

async function sendMessage() {
    if (!currentUser || !selectedUser) {
        showStatus("Please select a contact first.");
        return;
    }

    const text = messageInput.value.trim();

    if (!text) {
        messageInput.focus();
        return;
    }

    const recipient = selectedUser;
    const id = chatId(currentUser.uid, recipient.uid);

    sendBtn.disabled = true;

    try {
        // Get actual sender name
        const senderName = await getCurrentUserName();

        const timestamp = Date.now();

        // Save message
        await push(
            ref(database, `messages/${id}`),
            {
                senderId: currentUser.uid,
                receiverId: recipient.uid,
                senderName: senderName,
                text: text,
                timestamp: timestamp
            }
        );

        // Save notification for receiver
        await push(
            ref(database, `notifications/${recipient.uid}`),
            {
                senderId: currentUser.uid,
                senderName: senderName,
                message: text,
                timestamp: timestamp,
                read: false
            }
        );

        messageInput.value = "";

        // Stop typing status
        await set(
            ref(
                database,
                `typing/${currentUser.uid}/${recipient.uid}`
            ),
            false
        );

        showStatus("Message sent successfully!");

    } catch (error) {
        console.error("Send message error:", error);
        showStatus("Message failed: " + error.message);

    } finally {
        sendBtn.disabled = !selectedUser;
    }
}

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

// =====================================
// TYPING INDICATOR
// =====================================

messageInput.addEventListener("input", () => {
    if (!currentUser || !selectedUser) return;

    const typingRef = ref(
        database,
        `typing/${currentUser.uid}/${selectedUser.uid}`
    );

    set(typingRef, messageInput.value.trim().length > 0)
        .catch(error => console.error("Typing status error:", error));

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
        set(typingRef, false).catch(console.error);
    }, 1500);
});

// =====================================
// MORE MENU / CLEAR CONVERSATION
// =====================================

moreBtn.addEventListener("click", () => {
    moreMenu.classList.toggle("hidden");
});

document.addEventListener("click", event => {
    if (
        !moreMenu.contains(event.target) &&
        !moreBtn.contains(event.target)
    ) {
        moreMenu.classList.add("hidden");
    }
});

clearChatBtn.addEventListener("click", async () => {
    if (!selectedUser) {
        showStatus("Select a contact first.");
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to delete this conversation for both users?"
    );

    if (!confirmed) return;

    try {
        await remove(
            ref(
                database,
                `messages/${chatId(
                    currentUser.uid,
                    selectedUser.uid
                )}`
            )
        );

        moreMenu.classList.add("hidden");
        showStatus("Conversation cleared.");

    } catch (error) {
        console.error(error);
        showStatus("Unable to clear conversation: " + error.message);
    }
});

// =====================================
// EMOJI PICKER
// =====================================

emojiBtn.addEventListener("click", () => {
    emojiPicker.classList.toggle("hidden");
});

document.querySelectorAll(".emoji-option").forEach(button => {
    button.addEventListener("click", () => {
        messageInput.value += button.textContent;
        messageInput.focus();

        emojiPicker.classList.add("hidden");
        messageInput.dispatchEvent(new Event("input"));
    });
});

// =====================================
// ATTACHMENT PICKER
// =====================================

attachBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];

    if (!file) return;

    showStatus(`📎 Selected file: ${file.name}`);

    // This opens the file picker only.
    // Actual uploading requires Firebase Storage integration.
});

// =====================================
// LOGOUT
// =====================================

logoutBtn.addEventListener("click", async () => {
    try {
        if (currentUser) {
            await set(
                ref(database, `status/${currentUser.uid}`),
                {
                    state: "offline",
                    email: currentUser.email
                }
            );
        }

        if (stopUsers) stopUsers();
        if (stopMessages) stopMessages();
        if (stopStatus) stopStatus();
        if (stopTyping) stopTyping();
        if (stopConnection) stopConnection();

        presenceListeners.forEach(stop => stop());

        await signOut(auth);

        location.href = "./login.html";

    } catch (error) {
        console.error("Logout error:", error);
        showStatus("Logout failed: " + error.message);
    }
});