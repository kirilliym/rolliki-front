class LoginPage {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('loginBtn');
        this.spinner = document.getElementById('spinner');
        this.btnText = document.querySelector('.btn-text');
        this.errorMessage = document.getElementById('errorMessage');
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Сбрасываем ошибку при изменении полей
        [this.usernameInput, this.passwordInput].forEach(input => {
            input.addEventListener('input', () => {
                this.hideError();
            });
        });
    }
    
    async handleLogin() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();
        
        if (!username || !password) {
            this.showError('Заполните все поля');
            return;
        }
        
        this.setLoading(true);
        
        try {
            const response = await this.sendLoginRequest(username, password);
            
            if (response.status === 200) {
                const userData = await response.json();
                this.handleSuccess(userData);
            } else {
                this.handleError();
            }
        } catch (error) {
            console.log('Login error:', error);
            this.showError('Ошибка соединения с сервером');
        } finally {
            this.setLoading(false);
        }
    }
    
    async sendLoginRequest(username, password) {
        return fetch('http://localhost:8080/api/users/login', {
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
        // Сохраняем данные пользователя в localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', userData.token || 'dummy-token');
        
        // Редирект на страницу профиля
        window.location.href = 'src/profile/index.html';
    }
    
    handleError() {
        this.showError('Неверное имя пользователя или пароль');
        this.shakeForm();
    }
    
    setLoading(loading) {
        if (loading) {
            this.loginBtn.disabled = true;
            this.btnText.classList.add('hidden');
            this.spinner.classList.remove('hidden');
        } else {
            this.loginBtn.disabled = false;
            this.btnText.classList.remove('hidden');
            this.spinner.classList.add('hidden');
        }
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }
    
    hideError() {
        this.errorMessage.classList.add('hidden');
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
    new LoginPage();
    
    // Обработка ссылки регистрации - редирект на страницу регистрации
    const registerLink = document.querySelector('.register-link');
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'src/registration/index.html';
        });
    }
});