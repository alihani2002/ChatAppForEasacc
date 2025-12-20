    const currentChatId = "@Model.SessionId";
    const currentUserId = "@adminId";
    const otherUserId = "@Model.UserId";
    const isChatClosed = (isClosed ? "true" : "false");
    const MessageType = {
        Text: 0,
    Image: 1,
    Video: 2,
    Document: 3,
    Voice: 4
        };
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = {
        'image/jpeg': MessageType.Image,
    'image/png': MessageType.Image,
    'image/gif': MessageType.Image,
    'image/webp': MessageType.Image,
    'video/mp4': MessageType.Video,
    'video/webm': MessageType.Video,
    'audio/mpeg': MessageType.Voice,
    'audio/wav': MessageType.Voice,
    'audio/ogg': MessageType.Voice,
    'application/pdf': MessageType.Document,
    'application/msword': MessageType.Document,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': MessageType.Document,
    'text/plain': MessageType.Document
        };
    let connection = null;
    let typingTimeout = null;
    let isTyping = false;
    let sentMessageIds = new Set();
    let tempMessages = new Map();
    let currentTypingUsers = new Set();
    let uploadedFiles = [];

    // جمع معرفات الرسائل الموجودة
    document.addEventListener('DOMContentLoaded', function() {
            const existingMessages = document.querySelectorAll('[data-message-id]');
            existingMessages.forEach(msg => {
                const messageId = msg.getAttribute('data-message-id');
    if (messageId) {
        sentMessageIds.add(parseInt(messageId));
                }
            });
        });

    // تهيئة اتصال الإدمن
    function initializeAdminConnection() {
            if (isChatClosed) {
        addSystemMessage('هذه المحادثة مغلقة ولا يمكن إرسال رسائل جديدة');
    updateConnectionStatus('disconnected', 'المحادثة مغلقة');
    return;
            }

    connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
                        if (retryContext.elapsedMilliseconds < 10000) return 2000;
    if (retryContext.elapsedMilliseconds < 30000) return 5000;
    return 10000;
                    }
                })
    .configureLogging(signalR.LogLevel.Warning)
    .build();

    // إعداد أحداث SignalR
    setupSignalREvents();

    // بدء الاتصال
    connection.start()
                .then(() => {
        console.log("✅ الإدمن متصل بـ SignalR");
    updateConnectionStatus('connected', 'متصل بالمستخدم');
    joinChat();
                })
                .catch(err => {
        console.error("❌ فشل اتصال الإدمن:", err);
    updateConnectionStatus('disconnected', 'انقطع الاتصال');
    setTimeout(initializeAdminConnection, 5000);
                });
        }

    // إعداد أحداث SignalR
    function setupSignalREvents() {
        // استقبال رسائل الملفات
        connection.on("ReceiveFileMessage", (data) => {
            const isAdmin = (data.senderId || data.SenderId) === currentUserId;
            displayFileMessage(
                data.fileUrl || data.FileUrl,
                data.messageType || data.MessageType,
                data.fileName || data.FileName,
                isAdmin,
                data.time || data.Time,
                data.senderId || data.SenderId,
                data.messageId || data.MessageId
            );
            hideTypingIndicator(data.senderId || data.SenderId);
        });

            // استقبال الرسائل الجديدة
            connection.on("ReceiveMessage", (senderId, message, time, messageId = null) => {
                const isAdmin = senderId === currentUserId;

    // إزالة حالة عدم وجود رسائل
    removeEmptyState();

    // إذا كانت الرسالة لها معرف وتوجد بالفعل، تجاهلها
    if (messageId && sentMessageIds.has(messageId)) {
        console.log('تم تجاهل رسالة مكررة:', messageId);
    hideTypingIndicator(senderId);
    return;
                }

    // إذا كانت الرسالة من الإدمن ولها معرف، فهي نسخة من الخادم
    if (isAdmin && messageId) {
        updateTempMessage(messageId, message, time);
    hideTypingIndicator(senderId);
    return;
                }

    // إذا كانت الرسالة من الإدمن ولا يوجد معرف، قد تكون تكراراً
    if (isAdmin && !messageId) {
                    if (isDuplicateMessage(message, time, true)) {
        console.log('تم تجاهل رسالة مكررة من الإدمن:', message);
    hideTypingIndicator(senderId);
    return;
                    }
                }

    // إذا كانت الرسالة من المستخدم، إضافتها مباشرة
    if (!isAdmin) {
        addMessageToChat(message, false, time, senderId, messageId);
    hideTypingIndicator(senderId);
    return;
                }

    // إضافة الرسالة الجديدة
    addMessageToChat(message, isAdmin, time, senderId, messageId);
    hideTypingIndicator(senderId);
            });

            // مؤشر بدء الكتابة
            connection.on("UserStartedTyping", (chatId, userId) => {
                if (chatId === currentChatId && userId === otherUserId) {
        currentTypingUsers.add(userId);
    updateTypingIndicator();
                }
            });

            // مؤشر إيقاف الكتابة
            connection.on("UserStoppedTyping", (chatId, userId) => {
                if (chatId === currentChatId) {
        currentTypingUsers.delete(userId);
    updateTypingIndicator();
                }
            });

            // أحداث اتصال
            connection.onreconnecting(() => {
        updateConnectionStatus('connecting', 'إعادة الاتصال...');
            });

            connection.onreconnected(() => {
        updateConnectionStatus('connected', 'متصل');
    joinChat();
            });

            connection.onclose(() => {
        updateConnectionStatus('disconnected', 'انقطع الاتصال');
            });
        }

    // الانضمام للدردشة
    function joinChat() {
            if (connection && connection.state === 'Connected') {
        connection.invoke("JoinChat", currentChatId)
            .then(() => console.log("✅ الإدمن انضم للدردشة"))
            .catch(err => console.error("❌ فشل الانضمام:", err));
            }
        }

    // تحديث حالة الاتصال
    function updateConnectionStatus(status, text) {
            const statusElement = document.getElementById('connectionStatus');
    const statusDot = document.getElementById('statusDot');

    if (statusElement) {
        statusElement.textContent = text;
    statusElement.className = status;
            }

    if (statusDot) {
        statusDot.className = 'status-dot ' + status;
            }
        }

    // تحديث مؤشر الكتابة
    function updateTypingIndicator() {
            const indicator = document.getElementById('typingIndicator');
    const typingText = indicator?.querySelector('.typing-text');

            if (currentTypingUsers.size > 0 && indicator && typingText) {
        typingText.textContent = 'المستخدم يكتب...';
    indicator.style.display = 'flex';
            } else if (indicator) {
        indicator.style.display = 'none';
            }
        }

    // إخفاء مؤشر الكتابة
    function hideTypingIndicator(userId) {
        currentTypingUsers.delete(userId);
    updateTypingIndicator();
        }

    // التحقق من الرسالة المكررة
    function isDuplicateMessage(message, time, isAdmin = false) {
            const messageClass = isAdmin ? 'message-sent' : 'message-received';
    const recentMessages = document.querySelectorAll(`.${messageClass}`);
    const now = new Date();
    const currentTime = now.getTime();

    for (let msg of recentMessages) {
                const content = msg.querySelector('.message-text')?.textContent;
    const msgTimeText = msg.querySelector('.message-time')?.textContent;

    if (content === message && msgTimeText) {
                    const msgTime = parseMessageTime(msgTimeText);
    const newTime = parseMessageTime(time);
    if (Math.abs(msgTime - newTime) < 5000) {
                        return true;
                    }
                }
            }
    return false;
        }

    // تحويل وقت الرسالة
    function parseMessageTime(timeStr) {
            const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const messageTime = new Date(now);
    messageTime.setHours(hours, minutes, 0, 0);

            if (messageTime > now && messageTime - now > 12 * 60 * 60 * 1000) {
        messageTime.setDate(messageTime.getDate() - 1);
            }

    return messageTime.getTime();
        }

    // تحديث الرسالة المؤقتة
    function updateTempMessage(messageId, message, time) {
            for (let [tempId, tempData] of tempMessages) {
                if (tempData.message === message) {
                    const tempElement = document.querySelector(`[data-temp-id="${tempId}"]`);
    if (tempElement) {
        tempElement.setAttribute('data-message-id', messageId);
    tempElement.removeAttribute('data-temp-id');

    const timeSpan = tempElement.querySelector('.message-time');
    if (timeSpan && time) {
        timeSpan.textContent = time;
                        }

    const contentDiv = tempElement.querySelector('.message-content');
    if (contentDiv) {
        contentDiv.classList.remove('sending');
    contentDiv.classList.add('sent-confirmed');
                        }

    sentMessageIds.add(parseInt(messageId));
    tempMessages.delete(tempId);
    break;
                    }
                }
            }
        }

    // إزالة حالة عدم وجود رسائل
    function removeEmptyState() {
            const emptyState = document.querySelector('.empty-chat');
    if (emptyState) emptyState.remove();
        }

    // إضافة رسالة للدردشة
    function addMessageToChat(message, isAdmin, time = null, senderId = null, messageId = null) {
            const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    removeEmptyState();

    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message-wrapper ${isAdmin ? 'message-sent' : 'message-received'} new-message`;

    const now = new Date();
    const displayTime = time || now.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
    minute: '2-digit'
            });

    if (isAdmin) {
        messageWrapper.className = 'message-wrapper message-sent new-message';

    if (!messageId) {
                    const tempId = 'temp_' + Date.now();
    messageWrapper.setAttribute('data-temp-id', tempId);
    tempMessages.set(tempId, {
        message: message,
    time: displayTime
                    });
                } else {
        messageWrapper.setAttribute('data-message-id', messageId);
    sentMessageIds.add(parseInt(messageId));
                }
            } else {
        messageWrapper.className = 'message-wrapper message-received new-message';
    if (messageId) {
        messageWrapper.setAttribute('data-message-id', messageId);
    sentMessageIds.add(parseInt(messageId));
                }
            }

    const statusIcon = isAdmin ?
    '<span class="message-status"><i class="fas fa-check-circle"></i></span>' : '';

    messageWrapper.innerHTML = `
    <div class="message-content ${isAdmin && !messageId ? 'sending' : ''}">
        <div class="message-text">${escapeHtml(message)}</div>
        <div class="message-meta">
            <span class="message-time">${displayTime}</span>
            ${statusIcon}
        </div>
    </div>
    `;

    chatBox.appendChild(messageWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
        }

    // إضافة رسالة نظامية
    function addSystemMessage(text) {
            const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    removeEmptyState();

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-wrapper message-received';
    messageDiv.innerHTML = `
    <div class="message-content">
        <div class="message-text" style="font-style: italic; opacity: 0.7;">${escapeHtml(text)}</div>
        <div class="message-meta">
            <span class="message-time">${new Date().toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit'
            })}</span>
        </div>
    </div>
    `;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
        }

    // بدء الكتابة
    function startTyping() {
            if (!isTyping && connection && connection.state === 'Connected' && !isChatClosed) {
        isTyping = true;
    connection.invoke("StartTyping", currentChatId)
                    .catch(err => console.error("❌ فشل إرسال مؤشر الكتابة:", err));
            }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(stopTyping, 2000);
        }

    // إيقاف الكتابة
    function stopTyping() {
            if (isTyping && connection && connection.state === 'Connected' && !isChatClosed) {
        isTyping = false;
    connection.invoke("StopTyping", currentChatId)
                    .catch(err => console.error("❌ فشل إيقاف مؤشر الكتابة:", err));
            }
        }

    // إرسال رسالة من الإدمن
    function sendAdminMessage() {
            if (isChatClosed) {
        alert('لا يمكن إرسال رسائل في محادثة مغلقة');
    return;
            }

    const input = document.getElementById('msgInput');
    const message = input.value.trim();

    if (!message && uploadedFiles.length === 0) return;
    if (!connection || connection.state !== 'Connected') {
        alert('الاتصال غير نشط. يرجى الانتظار...');
    return;
            }

            // إذا كان هناك ملفات مرفوعة، أرسلها أولاً
            if (uploadedFiles.length > 0) {
        uploadFiles().then(() => {
            if (message) {
                sendTextMessage(message);
            }
        });
            } else if (message) {
        sendTextMessage(message);
            }

    input.value = '';
    stopTyping();
        }

    // إرسال رسالة نصية فقط
    function sendTextMessage(message) {
            if (!connection || connection.state !== 'Connected') {
        alert('الاتصال غير نشط. يرجى الانتظار...');
    return;
            }

    addMessageToChat(message, true, null, currentUserId);

    connection.invoke("SendMessage", currentChatId, message)
                .then(() => {
        console.log('تم إرسال الرسالة للخادم');
                })
                .catch(err => {
        console.error("❌ فشل إرسال الرسالة: ", err);
    addSystemMessage('فشل إرسال الرسالة، جاري إعادة المحاولة...');

    // تحديث حالة الرسالة إلى فاشلة
    const tempMessagesArray = Array.from(tempMessages.entries());
                    if (tempMessagesArray.length > 0) {
                        const [lastTempId, lastTempData] = tempMessagesArray[tempMessagesArray.length - 1];
    if (lastTempData.message === message) {
                            const tempMsg = document.querySelector(`[data-temp-id="${lastTempId}"]`);
    if (tempMsg) {
                                const contentDiv = tempMsg.querySelector('.message-content');
    if (contentDiv) {
        contentDiv.classList.remove('sending');
    contentDiv.classList.add('send-failed');
                                }
    tempMessages.delete(lastTempId);
                            }
                        }
                    }

                    setTimeout(() => {
                        if (connection && connection.state === 'Connected') {
        retrySendMessage(message);
                        }
                    }, 3000);
                });
        }

    // إعادة إرسال الرسالة
    function retrySendMessage(message) {
        connection.invoke("SendMessage", currentChatId, message)
            .then(() => {
                console.log('تمت إعادة إرسال الرسالة بنجاح');
            })
            .catch(err => {
                console.error("❌ فشل إعادة إرسال الرسالة: ", err);
            });
        }

    // إغلاق المحادثة
    function closeChat() {
            if (isChatClosed) {
        alert('المحادثة مغلقة بالفعل');
    return;
            }

    if (confirm('هل تريد إغلاق هذه المحادثة نهائياً؟ لن يتمكن المستخدم من إرسال رسائل جديدة.')) {
        fetch(`/Admin/Chat/CloseSession?sessionId=${currentChatId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => {
                if (response.ok) {
                    alert('تم إغلاق المحادثة بنجاح');
                    window.location.reload();
                } else {
                    alert('حدث خطأ أثناء إغلاق المحادثة');
                }
            })
            .catch(err => {
                console.error('خطأ في إغلاق المحادثة:', err);
                alert('حدث خطأ في الشبكة');
            });
            }
        }

    // التهريب من HTML
    function escapeHtml(text) {
            const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
        }

    // ==============================================
    // File Upload Functions
    // ==============================================
    function selectFiles() {
            const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.click();
        }

    function handleFileSelect(event) {
            const files = Array.from(event.target.files);
    for (const file of files) {
                if (file.size > MAX_FILE_SIZE) {
        alert(`الملف ${file.name} يتجاوز الحد المسموح (10MB)`);
    continue;
                }

    const messageType = ALLOWED_TYPES[file.type];
    if (!messageType) {
        alert(`نوع الملف ${file.name} غير مدعوم`);
    continue;
                }

    uploadedFiles.push({
        file: file,
    name: file.name,
    size: file.size,
    type: file.type
                });
            }

    updateFileDisplay();
    event.target.value = '';
        }

    function updateFileDisplay() {
            const container = document.getElementById('uploadedFiles');
    if (!container) {
        console.error('Container uploadedFiles not found');
    return;
            }

    if (uploadedFiles.length === 0) {
        container.style.display = 'none';
    container.innerHTML = '';
    return;
            }

    // إظهار الحاوية
    container.style.display = 'block';
    container.innerHTML = '';

            uploadedFiles.forEach((file, index) => {
                const fileElement = document.createElement('div');
    fileElement.className = 'uploaded-file';
    fileElement.innerHTML = `
    <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
    <span class="remove-file" onclick="removeFile(${index})" style="cursor: pointer;">
        <i class="fas fa-times"></i>
    </span>
    `;
    container.appendChild(fileElement);
            });

    // التأكد من أن الحاوية مرئية
    console.log('Files displayed:', uploadedFiles.length);
        }

    function removeFile(index) {
        uploadedFiles.splice(index, 1);
    updateFileDisplay();
        }

    async function uploadFile(file) {
            if (file.size > MAX_FILE_SIZE) {
                const errorMsg = `الملف ${file.name} يتجاوز الحد المسموح (10MB)`;
    alert(errorMsg);
    addSystemMessage(errorMsg);
    return null;
            }

    const messageType = ALLOWED_TYPES[file.type] || MessageType.Document;
    if (!messageType && !ALLOWED_TYPES[file.type]) {
                const errorMsg = `نوع الملف ${file.name} غير مدعوم`;
    alert(errorMsg);
    addSystemMessage(errorMsg);
    return null;
            }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("messageType", messageType);

    try {
        addSystemMessage(`جاري رفع ${file.name}...`);

    const response = await fetch(`/Chat/${currentChatId}/upload`, {
        method: 'POST',
    body: formData
                });

    if (!response.ok) {
                    const errorData = await response.json().catch(() => ({error: 'فشل رفع الملف' }));
    throw new Error(errorData.error || `خطأ في الرفع: ${response.status}`);
                }

    const data = await response.json();

    // Broadcast file message via SignalR
    if (connection && connection.state === 'Connected') {
        await connection.invoke("BroadcastFileMessage",
            currentChatId.toString(),
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

    // Fallback: Display locally
    displayFileMessage(
    data.fileUrl,
    data.messageType,
    data.fileName,
    true,
    data.time,
    currentUserId,
    data.id
    );

    addSystemMessage(`تم إرسال ${file.name} بنجاح`);
    return data;

            } catch (error) {
        console.error('❌ فشل رفع الملف:', error);
    const errorMsg = `فشل إرسال ${file.name}: ${error.message}`;
    addSystemMessage(errorMsg);
    alert(errorMsg);
    return null;
            }
        }

    async function uploadFiles() {
            for (const file of uploadedFiles) {
        await uploadFile(file.file);
            }
    uploadedFiles = [];
    updateFileDisplay();
        }

    // ==============================================
    // Receive File Messages
    // ==============================================
    function displayFileMessage(fileUrl, messageType, fileName, isSent, time, senderId, messageId = null) {
            const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    removeEmptyState();

    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message-wrapper ${isSent ? 'message-sent' : 'message-received'} new-message`;

    if (messageId) {
        messageWrapper.setAttribute('data-message-id', messageId);
    sentMessageIds.add(parseInt(messageId));
            }

    const displayTime = time || new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
    minute: '2-digit'
            });

    let content = '';
    const displayFileName = fileName || "ملف";

    // Convert to number if it's a string
    const msgType = typeof messageType === 'string' ? parseInt(messageType) : messageType;

    switch (msgType) {
                case MessageType.Image:
    case 1:
    content = `
    <div class="message-content">
        <img src="${fileUrl}" alt="${escapeHtml(displayFileName)}" class="chat-image"
            onclick="window.open('${fileUrl}', '_blank')" />
    </div>
    `;
    break;

    case MessageType.Video:
    case 2:
    content = `
    <div class="message-content">
        <video controls class="chat-video">
            <source src="${fileUrl}" type="video/mp4">
                ${escapeHtml(displayFileName)}
        </video>
    </div>
    `;
    break;

    case MessageType.Voice:
    case 4:
    content = `
    <div class="message-content">
        <audio controls class="chat-audio">
            <source src="${fileUrl}" type="audio/mpeg">
                ${escapeHtml(displayFileName)}
        </audio>
    </div>
    `;
    break;

    case MessageType.Document:
    case 3:
    default:
    content = `
    <div class="message-content">
        <a href="${fileUrl}" target="_blank" class="chat-file" download="${escapeHtml(displayFileName)}">
            <i class="fas fa-file-alt"></i>
            ${escapeHtml(displayFileName)}
        </a>
    </div>
    `;
    break;
            }

    const statusIcon = isSent ?
    '<span class="message-status"><i class="fas fa-check-circle"></i></span>' : '';

    messageWrapper.innerHTML = `
    ${content}
    <div class="message-meta">
        <span class="message-time">${displayTime}</span>
        ${statusIcon}
    </div>
    `;

    chatBox.appendChild(messageWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
        }

    // عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', function() {
            if (!currentUserId || currentUserId === '') {
        alert('خطأ: لم يتم التعرف على المستخدم');
    window.location.href = '/Account/Login';
    return;
            }

    if (!currentChatId || currentChatId === '0') {
        alert('خطأ: لم يتم تحديد محادثة');
    window.location.href = '/Chat';
    return;
            }

    if (!isChatClosed) {
        initializeAdminConnection();
            }

    // إعداد الأحداث
    const btnSend = document.getElementById('btnSend');
    const btnCloseChat = document.getElementById('btnCloseChat');
    const msgInput = document.getElementById('msgInput');
    const btnAttachment = document.getElementById('btnAttachment');
    const btnImage = document.getElementById('btnImage');
    const btnVoice = document.getElementById('btnVoice');
    const fileInput = document.getElementById('fileInput');

    if (btnSend) btnSend.addEventListener('click', sendAdminMessage);
    if (btnCloseChat) btnCloseChat.addEventListener('click', closeChat);
    if (btnAttachment) btnAttachment.addEventListener('click', selectFiles);
            if (btnImage) btnImage.addEventListener('click', () => {
                if (fileInput) {
        fileInput.accept = 'image/*';
    fileInput.click();
    fileInput.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
                }
            });
            if (btnVoice) btnVoice.addEventListener('click', () => {
                if (fileInput) {
        fileInput.accept = 'audio/*';
    fileInput.click();
    fileInput.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
                }
            });
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);

    if (msgInput && !isChatClosed) {
        msgInput.addEventListener('input', function () {
            if (this.value.trim()) {
                startTyping();
            }
        });

    msgInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
                        if (uploadedFiles.length > 0) {
        uploadFiles().then(() => {
            if (this.value.trim()) {
                sendAdminMessage();
            }
        });
                        } else {
        sendAdminMessage();
                        }
                    }
                });

    msgInput.addEventListener('blur', stopTyping);
            }

            setTimeout(() => {
                if (msgInput && !isChatClosed) msgInput.focus();
            }, 500);
        });

