let openedChats = new Map();

function openChat(sessionId) {

    if (openedChats.has(sessionId))
        return;

    openedChats.set(sessionId, []);

    const tab = document.createElement("button");
    tab.innerText = "Chat #" + sessionId;
    tab.onclick = () => activateChat(sessionId);

    document.getElementById("chatTabs").appendChild(tab);

    activateChat(sessionId);
}

function activateChat(sessionId) {
    document.querySelectorAll(".chat-window")
        .forEach(w => w.style.display = "none");

    document.getElementById("chat-" + sessionId).style.display = "block";
}
