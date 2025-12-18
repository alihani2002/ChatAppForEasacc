"use strict";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .configureLogging(signalR.LogLevel.Information)
    .build();

connection.start()
    .then(() => {
        console.log("✅ Connected to ChatHub");
        if (typeof currentChatId !== "undefined") {
            connection.invoke("JoinChat", currentChatId.toString());
        }
    })
    .catch(err => console.error(err.toString()));

function sendMessage(chatId, message) {
    if (!message || message.trim() === "") return;

    connection.invoke("SendMessage", chatId.toString(), message)
        .catch(err => console.error(err.toString()));
}

connection.on("ReceiveMessage", function (sender, message, time) {
    const box = document.getElementById("chatBox") || document.getElementById("messages");

    if (box) {
        const div = document.createElement("div");
        div.innerHTML = `<b>${sender}</b>: ${message} <small>${time}</small>`;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }
});
