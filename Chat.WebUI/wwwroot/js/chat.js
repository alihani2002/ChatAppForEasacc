// ~/js/chat.js
"use strict";

let connection = null;
let currentChatId = null;
let currentUserId = null;

// تهيئة الاتصال
function initializeChat(chatId, userId) {
    currentChatId = chatId;
    currentUserId = userId;

    connection = new signalR.HubConnectionBuilder()
        .withUrl("/chatHub")
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

    // أحداث SignalR
    setupSignalREvents();

    // بدء الاتصال
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

// إعداد أحداث SignalR
function setupSignalREvents() {
    // استقبال الرسائل
    connection.on("ReceiveMessage", (senderId, message, time) => {
        displayMessage(message, senderId === currentUserId, time, senderId);
    });
    connection.on("ReceiveFileMessage", (data) => {
        displayFileMessage(
            data.fileUrl,
            data.messageType,
            data.fileName,
            data.senderId === currentUserId,
            data.time,
            data.senderId
        );
    });
    // مؤشر الكتابة
    connection.on("UserTyping", (chatId, userId) => {
        if (chatId === currentChatId && userId !== currentUserId) {
            showTypingIndicator();
        }
    });

    // إعادة الاتصال
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

// عند الاتصال الناجح
function onConnected() {
    updateConnectionStatus("connected", "متصل");
    joinChatRoom();
}

function displayFileMessage(fileUrl, messageType, isMe, time, senderId) {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = isMe ? "message-sent" : "message-received";

    let content = "";

    switch (messageType) {
        case MessageType.Image:
            content = `<img src="${fileUrl}" class="chat-image" />`;
            break;

        case MessageType.Video:
            content = `
                <video controls class="chat-video">
                    <source src="${fileUrl}" type="video/mp4">
                </video>`;
            break;

        case MessageType.Audio:
            content = `
                <audio controls>
                    <source src="${fileUrl}" type="audio/mpeg">
                </audio>`;
            break;

        case MessageType.Document:
        default:
            content = `
                <a href="${fileUrl}" target="_blank" class="chat-file">
                    📎 تحميل الملف
                </a>`;
            break;
    }

    messageDiv.innerHTML = `
        ${!isMe ? `<div class="message-sender">الدعم</div>` : ""}
        <div class="message-content">${content}</div>
        <span class="message-time">${time}</span>
    `;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}


// الانضمام للغرفة
function joinChatRoom() {
    if (connection.state === signalR.HubConnectionState.Connected && currentChatId) {
        connection.invoke("JoinChat", currentChatId.toString())
            .catch(err => console.error("❌ JoinChat Error:", err));
    }
}

// عرض الرسالة
function displayMessage(message, isMe, time = null, senderId = null) {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;

    // إزالة رسالة التحميل
    const loadingMsg = chatBox.querySelector('.text-center.text-muted');
    if (loadingMsg) loadingMsg.remove();

    const messageDiv = document.createElement("div");
    const now = new Date();
    const displayTime = time || now.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // تحديد نوع الرسالة
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

    // إخفاء مؤشر الكتابة
    hideTypingIndicator();
}

// إرسال رسالة
function sendMessage(chatId, message) {
    if (!message.trim() || !connection) return;

    if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("SendMessage", chatId.toString(), message.trim())
            .catch(err => {
                console.error("❌ SendMessage Error:", err);
                displaySystemMessage("فشل إرسال الرسالة، جاري إعادة المحاولة...");

                // محاولة إعادة الإرسال
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

// عرض رسالة نظامية
function displaySystemMessage(text) {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = "message-system";
    messageDiv.innerHTML = `<i class="fas fa-info-circle me-1"></i> ${text}`;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// عرض مؤشر الكتابة
function showTypingIndicator() {
    const indicator = document.getElementById("typingIndicator");
    if (indicator) {
        indicator.style.display = "block";

        // إخفاء بعد 3 ثواني
        setTimeout(() => {
            hideTypingIndicator();
        }, 3000);
    }
}

// إخفاء مؤشر الكتابة
function hideTypingIndicator() {
    const indicator = document.getElementById("typingIndicator");
    if (indicator) {
        indicator.style.display = "none";
    }
}

// تحديث حالة الاتصال
function updateConnectionStatus(className, text) {
    const statusElement = document.getElementById("connectionStatus");
    if (statusElement) {
        statusElement.textContent = text;
        statusElement.className = className;
    }
}

// إشعار الكتابة
function notifyTyping() {
    if (connection && connection.state === signalR.HubConnectionState.Connected && currentChatId) {
        connection.invoke("NotifyTyping", currentChatId, currentUserId);
    }
}

// مغادرة المحادثة
function leaveChat() {
    if (connection && connection.state === signalR.HubConnectionState.Connected && currentChatId) {
        connection.invoke("LeaveChat", currentChatId.toString())
            .then(() => {
                connection.stop();
            })
            .catch(err => console.error("❌ LeaveChat Error:", err));
    }
}

// التهريب من HTML
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// تصدير الوظائف للاستخدام في ملفات أخرى
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

    const response = await fetch(`/${chatId}/upload`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        displaySystemMessage("فشل رفع الملف");
        return;
    }

    const data = await response.json();

    // بث الرسالة عبر SignalR
    await connection.invoke(
        "BroadcastFileMessage",
        chatId.toString(),
        data.id,
        data.fileUrl,
        data.messageType,
        data.fileName,
        data.time,
        data.senderId
    );
}
