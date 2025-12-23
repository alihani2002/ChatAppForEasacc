"use strict";

const MessageType = {
    Text: 0,
    Image: 1,
    Video: 2,
    Document: 3,
    Voice: 4
};

let connection = null;
let currentChatId = null;
let currentUserId = null;

function initializeChat(chatId, userId) {
    currentChatId = chatId;
    currentUserId = userId;

    connection = new signalR.HubConnectionBuilder()
        .withUrl("/chatHub")
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

    setupSignalREvents();

    connection.start()
        .then(() => {
            console.log("✅ SignalR Connected");
            onConnected();
        })
        .catch(err => {
            console.error("❌ Connection Failed:", err);
            setTimeout(() => initializeChat(chatId, userId), 5000);
        });
}

function setupSignalREvents() {
    connection.on("ReceiveMessage", (senderId, message, time) => {
        displayMessage(message, senderId === currentUserId, time, senderId);
    });
    connection.on("ReceiveFileMessage", (data) => {
        // Handle both PascalCase (from hub) and camelCase (from views)
        const fileUrl = data.fileUrl || data.FileUrl;
        const messageType = data.messageType || data.MessageType;
        const fileName = data.fileName || data.FileName;
        const senderId = data.senderId || data.SenderId;
        const time = data.time || data.Time;
        const isMe = senderId === currentUserId;
        
        displayFileMessage(
            fileUrl,
            messageType,
            fileName,
            isMe,
            time,
            senderId
        );
    });
    connection.on("UserTyping", (chatId, userId) => {
        if (chatId === currentChatId && userId !== currentUserId) {
            showTypingIndicator();
        }
    });

    connection.onreconnecting((error) => {
        console.log("🔄 Reconnecting...", error);
        updateConnectionStatus("reconnecting", "جاري إعادة الاتصال...");
    });

    connection.onreconnected((connectionId) => {
        console.log("✅ Reconnected");
        updateConnectionStatus("connected", "متصل");
        joinChatRoom();
    });

    connection.onclose((error) => {
        console.log("🔌 Connection Closed", error);
        updateConnectionStatus("disconnected", "انقطع الاتصال");
    });
}

function onConnected() {
    updateConnectionStatus("connected", "متصل");
    joinChatRoom();
}

function displayFileMessage(fileUrl, messageType, fileName, isMe, time, senderId) {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = isMe ? "message-sent" : "message-received";

    let content = "";
    const displayFileName = fileName || "ملف";

    // Convert to number if it's a string
    const msgType = typeof messageType === 'string' ? parseInt(messageType) : messageType;

    switch (msgType) {
        case MessageType.Image:
        case 1:
            content = `<img src="${fileUrl}" alt="${escapeHtml(displayFileName)}" class="chat-image" onclick="window.open('${fileUrl}', '_blank')" />`;
            break;

        case MessageType.Video:
        case 2:
            content = `
                <video controls class="chat-video">
                    <source src="${fileUrl}" type="video/mp4">
                    ${escapeHtml(displayFileName)}
                </video>`;
            break;

        case MessageType.Voice:
        case 4:
            content = `
                <audio controls class="chat-audio">
                    <source src="${fileUrl}" type="audio/mpeg">
                    ${escapeHtml(displayFileName)}
                </audio>`;
            break;

        case MessageType.Document:
        case 3:
        default:
            content = `
                <a href="${fileUrl}" target="_blank" class="chat-file" download="${escapeHtml(displayFileName)}">
                    <i class="fas fa-file-alt"></i>
                    ${escapeHtml(displayFileName)}
                </a>`;
            break;
    }

    messageDiv.innerHTML = `
        ${!isMe ? `<div class="message-sender">الدعم</div>` : ""}
        <div class="message-content">${content}</div>
        <span class="message-time">${time || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
    `;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}


function joinChatRoom() {
    if (connection.state === signalR.HubConnectionState.Connected && currentChatId) {
        connection.invoke("JoinChat", currentChatId.toString())
            .catch(err => console.error("❌ JoinChat Error:", err));
    }
}

function displayMessage(message, isMe, time = null, senderId = null) {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;

    const loadingMsg = chatBox.querySelector('.text-center.text-muted');
    if (loadingMsg) loadingMsg.remove();

    const messageDiv = document.createElement("div");
    const now = new Date();
    const displayTime = time || now.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (isMe) {
        messageDiv.className = "message-sent";
        messageDiv.innerHTML = `
            <div class="message-content">${escapeHtml(message)}</div>
            <span class="message-time">${displayTime}</span>
        `;
    } else {
        messageDiv.className = "message-received";
        const senderName = (senderId === currentUserId) ? 'أنت' : 'الدعم';
        messageDiv.innerHTML = `
            <div class="message-sender">${senderName}</div>
            <div class="message-content">${escapeHtml(message)}</div>
            <span class="message-time">${displayTime}</span>
        `;
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    hideTypingIndicator();
}

function sendMessage(chatId, message) {
    if (!message.trim() || !connection) return;

    if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("SendMessage", chatId.toString(), message.trim())
            .catch(err => {
                console.error("❌ SendMessage Error:", err);
                displaySystemMessage("فشل إرسال الرسالة، جاري إعادة المحاولة...");

                setTimeout(() => {
                    if (connection.state === signalR.HubConnectionState.Connected) {
                        connection.invoke("SendMessage", chatId.toString(), message.trim());
                    }
                }, 3000);
            });
    } else {
        displaySystemMessage("الاتصال غير متوفر، يرجى الانتظار...");
    }
}

function displaySystemMessage(text) {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = "message-system";
    messageDiv.innerHTML = `<i class="fas fa-info-circle me-1"></i> ${text}`;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.getElementById("typingIndicator");
    if (indicator) {
        indicator.style.display = "block";

        setTimeout(() => {
            hideTypingIndicator();
        }, 3000);
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById("typingIndicator");
    if (indicator) {
        indicator.style.display = "none";
    }
}

function updateConnectionStatus(className, text) {
    const statusElement = document.getElementById("connectionStatus");
    if (statusElement) {
        statusElement.textContent = text;
        statusElement.className = className;
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

window.chatHelper = {
    initialize: initializeChat,
    sendMessage: sendMessage,
    leaveChat: leaveChat,
    notifyTyping: notifyTyping
};

async function uploadFile(chatId, file, messageType) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("messageType", messageType);

    try {
        const response = await fetch(`/UserChat/${chatId}/upload`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'فشل رفع الملف' }));
            throw new Error(errorData.error || `خطأ في الرفع: ${response.status}`);
        }

        const data = await response.json();

        // Broadcast file message via SignalR
        if (connection && connection.state === signalR.HubConnectionState.Connected) {
            await connection.invoke("BroadcastFileMessage",
                chatId.toString(),
                {
                    MessageId: data.id,
                    FileUrl: data.fileUrl,
                    MessageType: data.messageType,
                    FileName: data.fileName,
                    Time: data.time,
                    SenderId: data.senderId
                }
            );
        }

        displaySystemMessage(`تم إرسال ${file.name} بنجاح`);
        return data;
    } catch (error) {
        console.error('❌ فشل رفع الملف:', error);
        displaySystemMessage(`فشل إرسال ${file.name}: ${error.message}`);
        return null;
    }
}
