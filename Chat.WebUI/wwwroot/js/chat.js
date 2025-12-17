const connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .build();

connection.start().then(() => {
    console.log("Connected to chat hub");
});

function joinChat(chatId) {
    connection.invoke("JoinChat", chatId);
}

function sendMessage(chatId, senderId, message) {
    connection.invoke("SendMessage", chatId, senderId, message);
}

connection.on("ReceiveMessage", (senderId, message) => {
    console.log(senderId + ": " + message);
});
