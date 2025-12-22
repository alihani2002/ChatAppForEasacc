document.addEventListener('DOMContentLoaded', function () {
    // إظهار/إخفاء كلمة المرور
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // فحص قوة كلمة المرور
    const passwordInput = document.getElementById('Input_Password');
    const confirmPasswordInput = document.getElementById('Input_ConfirmPassword');
    const progressBar = document.querySelector('.progress-bar');
    const strengthText = document.getElementById('password-strength-text');
    const matchText = document.getElementById('password-match-text');

    if (passwordInput && progressBar && strengthText) {
        function checkPasswordStrength(password) {
            let strength = 0;

            // طول كلمة المرور
            if (password.length >= 8) strength += 25;
            if (password.length >= 12) strength += 15;

            // وجود أحرف متنوعة
            if (/[a-z]/.test(password)) strength += 10;
            if (/[A-Z]/.test(password)) strength += 10;
            if (/[0-9]/.test(password)) strength += 20;
            if (/[^A-Za-z0-9]/.test(password)) strength += 20;

            // تحديث شريط التقدم
            progressBar.style.width = strength + '%';

            // تحديث النص والألوان
            if (strength < 30) {
                progressBar.className = 'progress-bar bg-danger';
                strengthText.textContent = 'قوة كلمة المرور: ضعيفة';
            } else if (strength < 60) {
                progressBar.className = 'progress-bar bg-warning';
                strengthText.textContent = 'قوة كلمة المرور: متوسطة';
            } else if (strength < 80) {
                progressBar.className = 'progress-bar bg-info';
                strengthText.textContent = 'قوة كلمة المرور: جيدة';
            } else {
                progressBar.className = 'progress-bar bg-success';
                strengthText.textContent = 'قوة كلمة المرور: قوية';
            }
        }

        passwordInput.addEventListener('input', function () {
            checkPasswordStrength(this.value);
            if (confirmPasswordInput) checkPasswordMatch();
        });
    }

    if (confirmPasswordInput && matchText) {
        function checkPasswordMatch() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (confirmPassword === '') {
                matchText.textContent = '';
                matchText.className = 'form-text text-muted';
            } else if (password === confirmPassword) {
                matchText.textContent = '✓ كلمات المرور متطابقة';
                matchText.className = 'form-text text-success';
            } else {
                matchText.textContent = '✗ كلمات المرور غير متطابقة';
                matchText.className = 'form-text text-danger';
            }
        }

        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }

    // التحقق من شروط الخدمة
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            const termsCheck = document.getElementById('termsCheck');
            if (termsCheck && !termsCheck.checked) {
                e.preventDefault();
                alert('يرجى الموافقة على شروط الخدمة وسياسة الخصوصية');
                termsCheck.focus();
            }
        });
    }

    // تأثير عند التركيز على الحقول
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', function () {
            if (this.parentElement.parentElement) {
                this.parentElement.parentElement.classList.add('focus');
            }
        });

        input.addEventListener('blur', function () {
            if (this.parentElement.parentElement) {
                this.parentElement.parentElement.classList.remove('focus');
            }
        });
    });
});
