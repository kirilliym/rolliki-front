class CreateProjectPage {
    constructor() {
        this.currentUser = null;
        this.currentUserId = null;
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.initEventListeners();
    }

    async loadUserData() {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                this.currentUserId = this.currentUser.id;
            } else {
                window.location.href = '../../index.html';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            window.location.href = '../../index.html';
        }
    }

    initEventListeners() {
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = '../profile/index.html';
        });

        document.getElementById('createProjectBtn').addEventListener('click', () => {
            this.createProject();
        });

        document.getElementById('notificationClose').addEventListener('click', () => {
            this.hideNotification();
        });

        document.getElementById('createProjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
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

    async createProject() {
        const name = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDescription').value.trim();
        const url = document.getElementById('projectUrl').value.trim();

        if (!name) {
            this.showNotification('Введите название проекта');
            return;
        }

        if (!url) {
            this.showNotification('Введите URL проекта');
            return;
        }

        const createBtn = document.getElementById('createProjectBtn');
        createBtn.disabled = true;
        createBtn.textContent = 'Создание...';

        try {
            const response = await fetch('http://localhost:8080/api/project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    url: url,
                    ownerId: this.currentUserId
                })
            });

            if (response.ok) {
                window.location.href = '../profile/index.html';
            } else {
                this.showNotification('Ошибка при создании проекта');
            }
        } catch (error) {
            console.error('Error creating project:', error);
            this.showNotification('Ошибка при создании проекта');
        } finally {
            createBtn.disabled = false;
            createBtn.textContent = 'Создать проект';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CreateProjectPage();
});