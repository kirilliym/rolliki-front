class InvitePersonPage {
    constructor() {
        this.currentProjectId = null;
        this.currentProject = null;
        this.availableRoles = [];
        
        this.init();
    }

    async init() {
        await this.loadProjectData();
        await this.loadAvailableRoles();
        this.initEventListeners();
        this.populateRoleSelect();
    }

    async loadProjectData() {
        try {
            this.currentProjectId = localStorage.getItem('currentProjectId');
            if (!this.currentProjectId) {
                window.location.href = '../../../settings/index.html';
                return;
            }

            // Загружаем данные проекта
            const response = await fetch(`http://localhost:8080/api/project/${this.currentProjectId}`);
            if (response.ok) {
                this.currentProject = await response.json();
                this.updateProjectDisplay();
            } else {
                this.showNotification('Ошибка загрузки данных проекта');
            }
        } catch (error) {
            console.error('Error loading project data:', error);
            window.location.href = '../../../settings/index.html';
        }
    }

    updateProjectDisplay() {
        const projectNameElement = document.getElementById('projectName');
        if (projectNameElement && this.currentProject) {
            projectNameElement.textContent = this.currentProject.name;
        }
    }

    async loadAvailableRoles() {
        try {
            const response = await fetch('http://localhost:8080/api/help/roles');
            if (response.ok) {
                this.availableRoles = await response.json();
            } else {
                this.showNotification('Ошибка загрузки списка ролей');
            }
        } catch (error) {
            console.error('Error loading roles:', error);
            this.showNotification('Ошибка загрузки списка ролей');
        }
    }

    populateRoleSelect() {
        const roleSelect = document.getElementById('roleSelect');
        
        this.availableRoles.forEach(role => {
            // if (role !== 'OWNER') { // Исключаем роль владельца
                const option = document.createElement('option');
                option.value = role;
                option.textContent = this.getRoleDisplayName(role);
                roleSelect.appendChild(option);
            // }
        });
    }

    initEventListeners() {
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = '../index.html';
        });

        document.getElementById('sendInviteBtn').addEventListener('click', () => {
            this.sendInvitation();
        });

        document.getElementById('notificationClose').addEventListener('click', () => {
            this.hideNotification();
        });

        document.getElementById('inviteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendInvitation();
        });
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        const messageElement = document.getElementById('notificationMessage');
        
        messageElement.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.add('hidden');
    }

    async sendInvitation() {
        const username = document.getElementById('usernameInput').value.trim();
        const role = document.getElementById('roleSelect').value;

        if (!username) {
            this.showNotification('Введите логин пользователя');
            return;
        }

        if (!role) {
            this.showNotification('Выберите роль');
            return;
        }

        const sendBtn = document.getElementById('sendInviteBtn');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Отправка...';

        try {
            // Получаем ID пользователя по логину
            const userResponse = await fetch(`http://localhost:8080/api/users/username/${username}`);
            
            if (!userResponse.ok) {
                throw new Error('Пользователь с таким логином не найден');
            }

            const userId = await userResponse.json();

            // Создаем приглашение
            const inviteResponse = await fetch('http://localhost:8080/api/connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: this.currentProjectId,
                    userId: userId,
                    role: role
                })
            });

            if (inviteResponse.ok) {
                window.location.href = '../index.html';
            } else {
                throw new Error('Ошибка при отправке приглашения');
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            this.showNotification(error.message || 'Ошибка при отправке приглашения');
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Отправить приглашение';
        }
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'OWNER': 'Владелец',
            'EDITOR': 'Редактор',
            'OPERATOR': 'Оператор',
            'DESIGNER': 'Дизайнер',
            'INVITE': 'Приглашенный'
        };
        return roleNames[role] || role;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new InvitePersonPage();
});