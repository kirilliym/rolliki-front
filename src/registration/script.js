class RegistrationPage {
    constructor() {
        this.form = document.getElementById('registrationForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.registrationBtn = document.getElementById('registrationBtn');
        this.spinner = document.getElementById('spinner');
        this.btnText = document.querySelector('.btn-text');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });
        
        // Сбрасываем ошибки при изменении полей
        [this.usernameInput, this.passwordInput, this.confirmPasswordInput].forEach(input => {
            input.addEventListener('input', () => {
                this.hideMessages();
            });
        });
    }
    
    async handleRegistration() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();
        const confirmPassword = this.confirmPasswordInput.value.trim();
        
        // Валидация
        const validationError = this.validateInputs(username, password, confirmPassword);
        if (validationError) {
            this.showError(validationError);
            return;
        }
        
        this.setLoading(true);
        this.hideMessages();
        
        try {
            const response = await this.sendRegistrationRequest(username, password);
            
            if (response.ok) {
                const userData = await response.json();
                this.handleSuccess(userData);
            } else if (response.status === 400) {
                this.showError('Пользователь с таким именем уже существует');
            } else {
                this.showError('Ошибка сервера. Попробуйте позже');
            }
        } catch (error) {
            console.error('Registration error:', error);
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                this.showError('Не удалось подключиться к серверу');
            } else {
                this.showError('Ошибка при регистрации');
            }
        } finally {
            this.setLoading(false);
        }
    }
    
    validateInputs(username, password, confirmPassword) {
        if (!username || !password || !confirmPassword) {
            return 'Заполните все поля';
        }
        
        if (username.length < 3 || username.length > 20) {
            return 'Имя пользователя должно быть от 3 до 20 символов';
        }
        
        if (password.length < 6) {
            return 'Пароль должен содержать не менее 6 символов';
        }
        
        if (password !== confirmPassword) {
            return 'Пароли не совпадают';
        }
        
        return null;
    }
    
    async sendRegistrationRequest(username, password) {
        return fetch('http://localhost:8080/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
    }
    
    handleSuccess(userData) {
        this.showSuccess('Регистрация успешна! Перенаправление...');
        
        // Редирект на страницу логина через 2 секунды
        setTimeout(() => {
            window.location.href = '../profile/index.html';
        }, 2000);
    }
    
    setLoading(loading) {
        if (loading) {
            this.registrationBtn.disabled = true;
            this.btnText.classList.add('hidden');
            this.spinner.classList.remove('hidden');
        } else {
            this.registrationBtn.disabled = false;
            this.btnText.classList.remove('hidden');
            this.spinner.classList.add('hidden');
        }
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
        this.successMessage.classList.add('hidden');
        this.shakeForm();
    }
    
    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.classList.remove('hidden');
        this.errorMessage.classList.add('hidden');
    }
    
    hideMessages() {
        this.errorMessage.classList.add('hidden');
        this.successMessage.classList.add('hidden');
    }
    
    shakeForm() {
        this.form.classList.add('shake');
        setTimeout(() => {
            this.form.classList.remove('shake');
        }, 500);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new RegistrationPage();
});