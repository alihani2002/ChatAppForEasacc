    $(document).ready(function() {
        // Initialize animations
        initAnimations();

    // Start chat simulation
    simulateChat();

    // Start counter animations
    startCounters();
        });

    function simulateChat() {
            const chatBody = $('.chat-body');
    const messages = [
    {type: 'incoming', text: 'أود المساعدة في إعداد حسابي الجديد', time: '2:33 PM' },
    {type: 'incoming', text: 'هل يمكنك مساعدتي في ذلك؟', time: '2:33 PM' },
    {type: 'outgoing', text: 'بالتأكيد! دعني أرشدك خلال خطوات إعداد الحساب', time: '2:34 PM' }
    ];

    let index = 0;

    function addMessage() {
                if (index < messages.length) {
                    const msg = messages[index];
    const messageHTML = `
    <div class="message ${msg.type}">
        <div class="message-content">
            <p>${msg.text}</p>
            <span class="message-time">${msg.time}</span>
        </div>
    </div>
    `;

    chatBody.append(messageHTML);
    chatBody.scrollTop(chatBody[0].scrollHeight);

    index++;

    if (index < messages.length) {
        setTimeout(addMessage, 1500);
                    }
                }
            }

    // Start simulation after 2 seconds
    setTimeout(addMessage, 2000);
        }

    function startCounters() {
        $('.stat-number[data-count]').each(function () {
            const $this = $(this);
            const target = parseFloat($this.data('count'));
            const suffix = $this.data('suffix') || '';
            const duration = 2000;
            const steps = 60;
            const stepValue = target / steps;
            let current = 0;
            let step = 0;

            const counter = setInterval(() => {
                current += stepValue;
                step++;

                if (step >= steps) {
                    current = target;
                    clearInterval(counter);
                }

                if ($this.data('count').toString().includes('.')) {
                    $this.text(current.toFixed(1) + suffix);
                } else {
                    $this.text(Math.floor(current) + suffix);
                }
            }, duration / steps);
        });
        }

    // Smooth scroll to features
    $('a[href^="#features"]').click(function(e) {
        e.preventDefault();
    const target = $('#features');
    if (target.length) {
        $('html, body').animate({
            scrollTop: target.offset().top - 80
        }, 1000);
            }
        });
