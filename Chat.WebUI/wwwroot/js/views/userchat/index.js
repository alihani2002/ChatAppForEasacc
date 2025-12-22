// ==============================================
// الثوابت والمتغيرات
// ==============================================
const MessageType = {
    Text: 0,
    Image: 1,
    Video: 2,
    Document: 3,
    Voice: 4
};

let currentChatId = null;
let currentUserId = null;
const MAX_CHARS = 500;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VOICE_SECONDS = 300; // 5 دقائق كحد أقصى
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
    'audio/webm': MessageType.Voice,
    'application/pdf': MessageType.Document,
    'application/msword': MessageType.Document,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': MessageType.Document,
    'text/plain': MessageType.Document
};

let connection = null;
let typingTimeout = null;
let isTyping = false;
let uploadedFiles = [];
let mediaRecorder = null;
let audioChunks = [];
let recordedAudio = null;
let recordTimer = null;
let recordSeconds = 0;
let audioStream = null;

function initUserChat(chatId, userId) {
    currentChatId = chatId;
    currentUserId = userId;
    setupChatUI();
}

function setupChatUI() {
    if (!currentUserId || !currentChatId) {
        alert('خطأ في البيانات، سيتم التوجيه إلى الصفحة الرئيسية');
        window.location.href = '/';
        return;
    }

    initializeConnection();

    // عناصر DOM
    const input = document.getElementById('msgInput');
    const btnSend = document.getElementById('btnSend');
    const btnEndChat = document.getElementById('btnEndChat');
    const btnAttachment = document.getElementById('btnAttachment');
    const btnImage = document.getElementById('btnImage');
    const btnCamera = document.getElementById('btnCamera');
    const btnVoice = document.getElementById('btnVoice');
    const fileInput = document.getElementById('fileInput');
    const voiceModal = document.getElementById('voiceRecordModal');

    // Voice recording elements
    const btnStartRecord = document.getElementById('btnStartRecord');
    const btnStopRecord = document.getElementById('btnStopRecord');
    const btnPlayRecord = document.getElementById('btnPlayRecord');
    const btnSendVoice = document.getElementById('btnSendVoice');
    const btnCancelVoice = document.getElementById('btnCancelVoice');
    const btnCloseModal = document.querySelector('.btn-close-modal');

    // إعداد event listeners للنص
    if (input) {
        input.addEventListener('input', function () {
            updateCharCount();
            if (this.value.trim()) {
                startTyping();
            } else {
                stopTyping();
            }
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (uploadedFiles.length > 0) {
                    uploadFiles().then(() => {
                        if (this.value.trim()) {
                            sendMessage();
                        }
                    });
                } else {
                    sendMessage();
                }
            }
        });

        input.addEventListener('blur', stopTyping);
    }

    // إعداد أزرار الإرسال الأساسية
    if (btnSend) btnSend.addEventListener('click', sendMessage);

    if (btnEndChat) {
        btnEndChat.addEventListener('click', function () {
            if (confirm('هل تريد إنهاء المحادثة؟')) {
                if (connection) {
                    connection.invoke("LeaveChat", currentChatId.toString())
                        .then(() => {
                            connection.stop();
                            window.location.href = '/';
                        })
                        .catch(err => console.error("❌ فشل إنهاء المحادثة:", err));
                } else {
                    window.location.href = '/';
                }
            }
        });
    }

    // إعداد أزرار الملفات
    if (btnAttachment) btnAttachment.addEventListener('click', selectFiles);

    if (btnImage) {
        btnImage.addEventListener('click', () => {
            fileInput.accept = 'image/*';
            fileInput.click();
            fileInput.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
        });
    }

    if (btnCamera) {
        btnCamera.addEventListener('click', function () {
            // For camera access, you'll need to use getUserMedia API
            fileInput.accept = 'image/*;capture=camera';
            fileInput.click();
        });
    }

    // إعداد زر التسجيل الصوتي
    if (btnVoice) {
        btnVoice.addEventListener('click', openVoiceModal);
    }

    // إعداد input الملفات
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // إعداد event listeners للتسجيل الصوتي
    if (btnStartRecord) btnStartRecord.addEventListener('click', startRecording);
    if (btnStopRecord) btnStopRecord.addEventListener('click', stopRecording);
    if (btnPlayRecord) btnPlayRecord.addEventListener('click', playRecording);
    if (btnSendVoice) btnSendVoice.addEventListener('click', sendVoiceMessage);
    if (btnCancelVoice) btnCancelVoice.addEventListener('click', closeVoiceModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeVoiceModal);

    // إغلاق المودال عند النقر خارجها
    if (voiceModal) {
        voiceModal.addEventListener('click', function (e) {
            if (e.target === this) {
                closeVoiceModal();
            }
        });
    }

    // Auto focus on input
    setTimeout(() => {
        if (input) input.focus();
    }, 1000);

    // التحقق من دعم المتصفح للتسجيل الصوتي
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('⚠️ التسجيل الصوتي غير مدعوم في هذا المتصفح');
        if (btnVoice) btnVoice.disabled = true;
        if (btnVoice) btnVoice.title = 'التسجيل الصوتي غير مدعوم في هذا المتصفح';
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', function () {
    if (connection && connection.state === 'Connected') {
        connection.invoke("LeaveChat", currentChatId.toString())
            .catch(err => console.error("❌ فشل الخروج:", err));
    }

    // تنظيف مصادر التسجيل الصوتي
    if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio);
    }
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
    }
});

// ==============================================
// دوال الاتصال
// ==============================================
function initializeConnection() {
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

    setupSignalREvents();

    connection.start()
        .then(() => {
            console.log("✅ متصل بـ SignalR");
            updateConnectionStatus('connected', 'متصل بالدعم');
            joinChat();
        })
        .catch(err => {
            console.error("❌ فشل الاتصال:", err);
            updateConnectionStatus('disconnected', 'انقطع الاتصال');
            setTimeout(initializeConnection, 5000);
        });
}

function setupSignalREvents() {
    // استقبال الرسائل النصية
    connection.on("ReceiveMessage", (senderId, message, time) => {
        const isMe = senderId === currentUserId;
        displayMessage(message, isMe, time, senderId);
    });

    // استقبال رسائل الملفات - Handle both PascalCase and camelCase
    connection.on("ReceiveFileMessage", (data) => {
        const isMe = (data.senderId || data.SenderId) === currentUserId;
        displayFileMessage(
            data.fileUrl || data.FileUrl,
            data.messageType || data.MessageType,
            data.fileName || data.FileName,
            isMe,
            data.time || data.Time,
            data.senderId || data.SenderId,
            data.messageId || data.MessageId
        );
    });

    // مؤشرات الكتابة
    connection.on("UserStartedTyping", (chatId, userId) => {
        if (chatId === currentChatId && userId !== currentUserId) {
            showTypingIndicator(userId);
        }
    });

    connection.on("UserStoppedTyping", (chatId, userId) => {
        if (chatId === currentChatId) {
            hideTypingIndicator();
        }
    });

    // تحديث حالة الرسالة
    connection.on("MessageStatusUpdated", (messageId, status) => {
        // Handle message status updates if needed
    });

    // أحداث النظام
    connection.on("UserJoined", (userId) => {
        if (userId !== currentUserId) {
            displaySystemMessage('انضم ممثل الدعم إلى المحادثة');
        }
    });

    connection.on("UserLeft", (userId) => {
        if (userId !== currentUserId) {
            displaySystemMessage('غادر ممثل الدعم المحادثة');
        }
    });

    connection.on("SessionTimeout", (message) => {
        displaySystemMessage(message);
        setTimeout(() => {
            if (confirm("تم إنهاء المحادثة لعدم النشاط. هل تريد بدء محادثة جديدة؟")) {
                window.location.href = "/";
            }
        }, 2000);
    });

    // أحداث الاتصال
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

function joinChat() {
    if (connection && connection.state === 'Connected') {
        connection.invoke("JoinChat", currentChatId.toString())
            .then(() => console.log("✅ انضم للدردشة"))
            .catch(err => console.error("❌ فشل الانضمام:", err));
    }
}

// ==============================================
// دوال العرض
// ==============================================
function displayMessage(message, isSent, time = null, senderId = null) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    const welcomeMsg = chatBox.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'message-sent' : 'message-received'}`;

    const now = new Date();
    const displayTime = time || now.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (isSent) {
        messageDiv.innerHTML = `
            <div class="message-content">${escapeHtml(message)}</div>
            <span class="message-time">${displayTime}</span>
        `;
    } else {
        const senderName = 'الدعم الفني';
        messageDiv.innerHTML = `
            <div class="message-sender">${senderName}</div>
            <div class="message-content">${escapeHtml(message)}</div>
            <span class="message-time">${displayTime}</span>
        `;
    }

    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

function displayFileMessage(fileUrl, messageType, fileName, isSent, time, senderId, messageId = null) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    if (messageId && chatBox.querySelector(`.message[data-message-id="${messageId}"]`)) {
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'message-sent' : 'message-received'}`;
    if (messageId) messageDiv.setAttribute('data-message-id', messageId);

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
                        <source src="${fileUrl}" type="audio/webm">
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

    if (isSent) {
        messageDiv.innerHTML = `
            ${content}
            <span class="message-time">${displayTime}</span>
        `;
    } else {
        const senderName = 'الدعم الفني';
        messageDiv.innerHTML = `
            <div class="message-sender">${senderName}</div>
            ${content}
            <span class="message-time">${displayTime}</span>
        `;
    }

    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

function displaySystemMessage(text) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-system';
    messageDiv.innerHTML = `<i class="fas fa-info-circle me-1"></i> ${escapeHtml(text)}`;

    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

// ==============================================
// دوال إرسال الرسائل
// ==============================================
function sendMessage() {
    const input = document.getElementById('msgInput');
    const message = input.value.trim();

    if (!message && uploadedFiles.length === 0) return;

    if (message.length > MAX_CHARS) {
        alert(`الحد الأقصى ${MAX_CHARS} حرف`);
        return;
    }

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
    uploadedFiles = [];
    updateFileDisplay();
    updateCharCount();
    stopTyping();
}

function sendTextMessage(message) {
    if (connection && connection.state === 'Connected') {
        // displayMessage(message, true, null, currentUserId); // Removed to prevent duplication

        connection.invoke("SendMessage", currentChatId.toString(), message)
            .then(() => {
                console.log('✅ تم إرسال الرسالة');
            })
            .catch(err => {
                console.error("❌ فشل إرسال الرسالة:", err);
                displaySystemMessage('فشل إرسال الرسالة، جاري إعادة المحاولة...');

                setTimeout(() => {
                    if (connection && connection.state === 'Connected') {
                        connection.invoke("SendMessage", currentChatId.toString(), message);
                    }
                }, 3000);
            });
    } else {
        displaySystemMessage('الاتصال غير متوفر، يرجى الانتظار...');
    }
}

async function uploadFile(file) {
    if (file.size > MAX_FILE_SIZE) {
        alert(`الملف ${file.name} يتجاوز الحد المسموح (10MB)`);
        return null;
    }

    const messageType = ALLOWED_TYPES[file.type] || MessageType.Document;
    if (!messageType) {
        alert(`نوع الملف ${file.name} غير مدعوم`);
        return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("messageType", messageType);

    try {
        displaySystemMessage(`جاري رفع ${file.name}...`);

        const response = await fetch(`/UserChat/${currentChatId}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'فشل رفع الملف' }));
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

        displaySystemMessage(`تم إرسال ${file.name} بنجاح`);
        return data;

    } catch (error) {
        console.error('❌ فشل رفع الملف:', error);
        const errorMsg = `فشل إرسال ${file.name}: ${error.message}`;
        displaySystemMessage(errorMsg);
        alert(errorMsg);
        return null;
    }
}

async function uploadFiles() {
    for (const fileData of uploadedFiles) {
        await uploadFile(fileData.file);
    }
}

// ==============================================
// دوال مساعدة
// ==============================================
function updateConnectionStatus(status, text) {
    const statusElement = document.getElementById('connectionStatus');
    const statusDot = document.getElementById('statusDot');

    if (statusElement && statusDot) {
        statusElement.textContent = text;
        statusElement.className = status;
        statusDot.className = 'status-dot ' + status;
    }
}

function showTypingIndicator(userId) {
    const indicator = document.getElementById('typingIndicator');
    const typingText = indicator?.querySelector('.typing-text');

    if (indicator && typingText) {
        typingText.textContent = 'الدعم يكتب...';
        indicator.style.display = 'flex';

        // إخفاء بعد 3 ثواني
        setTimeout(() => {
            hideTypingIndicator();
        }, 3000);
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

function startTyping() {
    if (!isTyping && connection && connection.state === 'Connected') {
        isTyping = true;
        connection.invoke("StartTyping", currentChatId.toString())
            .catch(err => console.error("❌ فشل إرسال مؤشر الكتابة:", err));
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(stopTyping, 2000);
}

function stopTyping() {
    if (isTyping && connection && connection.state === 'Connected') {
        isTyping = false;
        connection.invoke("StopTyping", currentChatId.toString())
            .catch(err => console.error("❌ فشل إيقاف مؤشر الكتابة:", err));
    }
}

function updateCharCount() {
    const input = document.getElementById('msgInput');
    const charCount = document.getElementById('charCount');

    if (!input || !charCount) return;

    const length = input.value.length;
    charCount.textContent = `${length}/${MAX_CHARS}`;

    charCount.className = 'char-count';
    if (length > MAX_CHARS * 0.8) {
        charCount.classList.add('warning');
    }
    if (length > MAX_CHARS * 0.9) {
        charCount.classList.add('danger');
    }
}

function scrollToBottom() {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    requestAnimationFrame(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==============================================
// إدارة الملفات
// ==============================================
function selectFiles() {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
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

    if (!container) return;

    if (uploadedFiles.length === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = '';

    uploadedFiles.forEach((file, index) => {
        const fileElement = document.createElement('div');
        fileElement.className = 'uploaded-file';
        fileElement.innerHTML = `
            <span class="file-name" title="${file.name}">${file.name}</span>
            <span class="remove-file" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </span>
        `;
        container.appendChild(fileElement);
    });
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFileDisplay();
}

// ==============================================
// Voice Recording Functions
// ==============================================
function openVoiceModal() {
    const modal = document.getElementById('voiceRecordModal');
    modal.style.display = 'flex';
    initVoiceRecorder();
}

function closeVoiceModal() {
    const modal = document.getElementById('voiceRecordModal');
    modal.style.display = 'none';
    stopRecording();
    resetVoiceRecorder();
}

async function initVoiceRecorder() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('الميكروفون غير مدعوم في هذا المتصفح');
        }

        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        mediaRecorder = new MediaRecorder(audioStream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            if (audioChunks.length > 0) {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                recordedAudio = URL.createObjectURL(audioBlob);

                // تمكين زر الاستماع والإرسال
                document.getElementById('btnPlayRecord').disabled = false;
                document.getElementById('btnSendVoice').disabled = false;

                // عرض رسالة تأكيد
                displaySystemMessage('تم حفظ التسجيل الصوتي. اضغط "استماع" للتحقق منه.');
            }
        };

        // تمكين زر البدء
        document.getElementById('btnStartRecord').disabled = false;

        // إنشاء مؤشر مرئي
        createVisualizer();

    } catch (err) {
        console.error("❌ خطأ في الوصول للميكروفون:", err);
        alert('لا يمكن الوصول للميكروفون. يرجى التحقق من صلاحيات المتصفح.');
        closeVoiceModal();
    }
}

function createVisualizer() {
    const visualizer = document.getElementById('voiceVisualizer');
    if (!visualizer || !audioStream) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = document.createElement('canvas');
    canvas.width = visualizer.clientWidth;
    canvas.height = visualizer.clientHeight;
    const ctx = canvas.getContext('2d');
    visualizer.innerHTML = '';
    visualizer.appendChild(canvas);

    function draw() {
        if (!mediaRecorder || mediaRecorder.state !== 'recording') {
            return;
        }

        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;

            ctx.fillStyle = `rgb(${barHeight + 100}, 50, 150)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    draw();
}

function startRecording() {
    if (!mediaRecorder) return;

    // إعادة تهيئة المصفوفات
    audioChunks = [];
    recordSeconds = 0;

    // بدء التسجيل
    mediaRecorder.start();
    console.log('🎤 بدأ التسجيل');

    // تحديث حالة الأزرار
    document.getElementById('btnStartRecord').disabled = true;
    document.getElementById('btnStopRecord').disabled = false;
    document.getElementById('btnPlayRecord').disabled = true;
    document.getElementById('btnSendVoice').disabled = true;

    // بدء المؤقت
    updateRecordTimer();
    recordTimer = setInterval(updateRecordTimer, 1000);
}

function stopRecording() {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;

    mediaRecorder.stop();
    console.log('⏹️ توقف التسجيل');

    // تحديث حالة الأزرار
    document.getElementById('btnStartRecord').disabled = false;
    document.getElementById('btnStopRecord').disabled = true;

    // إيقاف المؤقت
    clearInterval(recordTimer);

    // إغلاق stream
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
    }
}

function playRecording() {
    if (!recordedAudio) return;

    const audioPlayer = new Audio(recordedAudio);
    audioPlayer.controls = false;

    audioPlayer.onended = () => {
        document.getElementById('btnPlayRecord').innerHTML = '<i class="fas fa-play"></i><span>استماع</span>';
    };

    audioPlayer.onplay = () => {
        document.getElementById('btnPlayRecord').innerHTML = '<i class="fas fa-pause"></i><span>إيقاف</span>';
    };

    audioPlayer.play();
}

function updateRecordTimer() {
    recordSeconds++;
    const minutes = Math.floor(recordSeconds / 60).toString().padStart(2, '0');
    const seconds = (recordSeconds % 60).toString().padStart(2, '0');
    document.getElementById('recordTime').textContent = `${minutes}:${seconds}`;

    // تحذير قبل 30 ثانية من النهاية
    if (recordSeconds >= (MAX_VOICE_SECONDS - 30)) {
        const remaining = MAX_VOICE_SECONDS - recordSeconds;
        if (remaining === 30 || remaining === 10 || remaining <= 5) {
            displaySystemMessage(`متبقي ${remaining} ثانية للتسجيل`);
        }
    }

    // إيقاف التلقائي عند الوصول للحد
    if (recordSeconds >= MAX_VOICE_SECONDS) {
        stopRecording();
        alert('تم الوصول للحد الأقصى للتسجيل (5 دقائق)');
    }
}

function resetVoiceRecorder() {
    // إيقاف أي تسجيل قيد التشغيل
    if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio);
        recordedAudio = null;
    }

    // تنظيف المصفوفات
    audioChunks = [];
    recordSeconds = 0;

    // إعادة تعيين الأزرار
    document.getElementById('btnStartRecord').disabled = true;
    document.getElementById('btnStopRecord').disabled = true;
    document.getElementById('btnPlayRecord').disabled = true;
    document.getElementById('btnSendVoice').disabled = true;
    document.getElementById('recordTime').textContent = '00:00';

    // إيقاف المؤقت
    clearInterval(recordTimer);

    // مسح المؤشر المرئي
    const visualizer = document.getElementById('voiceVisualizer');
    if (visualizer) {
        visualizer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--gray-dark);">سيظهر المؤشر الصوتي هنا عند التسجيل</div>';
    }
}

async function sendVoiceMessage() {
    if (!recordedAudio || audioChunks.length === 0) {
        alert('لا يوجد تسجيل صوتي لإرساله');
        return;
    }

    try {
        // عرض رسالة تحميل
        displaySystemMessage('جاري إرسال الرسالة الصوتية...');

        // إنشاء ملف من التسجيل
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const fileName = `voice_message_${Date.now()}.webm`;
        const file = new File([audioBlob], fileName, { type: 'audio/webm' });

        // رفع الملف
        const result = await uploadFile(file);

        if (result) {
            displaySystemMessage('تم إرسال الرسالة الصوتية بنجاح');
            closeVoiceModal();
        } else {
            alert('فشل إرسال الرسالة الصوتية');
        }

    } catch (error) {
        console.error('❌ فشل إرسال التسجيل الصوتي:', error);
        displaySystemMessage('فشل إرسال الرسالة الصوتية');
        alert('حدث خطأ أثناء إرسال الرسالة الصوتية');
    }
}
