class SettingsPage {
    constructor() {
        this.currentUser = null;
        this.currentUserId = null;
        this.currentProjectId = null;
        this.currentProject = null;
        this.originalProjectData = null;
        
        this.init();
    }

    async init() {
        await this.loadUserData();
        await this.loadProjectData();
        this.initEventListeners();
        await this.loadTeamMembers();
    }

    async loadUserData() {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                this.currentUserId = this.currentUser.id;
            } else {
                window.location.href = '../../../index.html';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            window.location.href = '../../../index.html';
        }
    }

    async loadProjectData() {
        try {
            this.currentProjectId = localStorage.getItem('currentProjectId');
            if (!this.currentProjectId) {
                window.location.href = '../../profile/index.html';
                return;
            }

            const response = await fetch(`http://localhost:8080/api/project/${this.currentProjectId}`);
            if (response.ok) {
                this.currentProject = await response.json();
                this.originalProjectData = { ...this.currentProject };
                this.updateProjectDisplay();
                this.fillFormData();
            } else {
                this.showNotification('Ошибка загрузки данных проекта');
            }
        } catch (error) {
            console.error('Error loading project data:', error);
            this.showNotification('Ошибка загрузки данных проекта');
        }
    }

    updateProjectDisplay() {
        const projectNameElement = document.getElementById('projectName');
        if (projectNameElement && this.currentProject) {
            projectNameElement.textContent = this.currentProject.name;
        }
    }

    fillFormData() {
        if (this.currentProject) {
            document.getElementById('projectNameInput').value = this.currentProject.name || '';
            document.getElementById('projectDescriptionInput').value = this.currentProject.description || '';
            document.getElementById('projectUrlInput').value = this.currentProject.url || '';
        }
    }

    initEventListeners() {
        document.getElementById('backBtn').addEventListener('click', () => {
            localStorage.removeItem('currentProjectId');
            window.location.href = '../../profile/index.html';
        });

        document.getElementById('videosBtn').addEventListener('click', () => {
            window.location.href = '../videos/index.html';
        });

        document.getElementById('teamBtn').addEventListener('click', () => {
            window.location.href = '../team/index.html';
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            // Уже на этой странице
        });

        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('deleteProjectBtn').addEventListener('click', () => {
            this.showDeleteConfirmation();
        });

        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteProject();
        });

        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.hideDeleteConfirmation();
        });

        document.getElementById('notificationClose').addEventListener('click', () => {
            this.hideNotification();
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

    showDeleteConfirmation() {
        document.getElementById('deleteConfirmation').classList.remove('hidden');
    }

    hideDeleteConfirmation() {
        document.getElementById('deleteConfirmation').classList.add('hidden');
    }

    async saveSettings() {
        const name = document.getElementById('projectNameInput').value.trim();
        const description = document.getElementById('projectDescriptionInput').value.trim();
        const url = document.getElementById('projectUrlInput').value.trim();

        if (!name) {
            this.showNotification('Введите название проекта');
            return;
        }

        if (!url) {
            this.showNotification('Введите URL проекта');
            return;
        }

        const saveBtn = document.getElementById('saveSettingsBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Сохранение...';

        try {
            const response = await fetch(`http://localhost:8080/api/project/${this.currentProjectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    url: url
                })
            });

            if (response.ok) {
                this.currentProject.name = name;
                this.currentProject.description = description;
                this.currentProject.url = url;
                this.updateProjectDisplay();
            } else {
                this.showNotification('Ошибка при сохранении настроек');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Ошибка при сохранении настроек');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Сохранить изменения';
        }
    }

    async deleteProject() {
        try {
            const response = await fetch(`http://localhost:8080/api/project/${this.currentProjectId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                localStorage.removeItem('currentProjectId');
                window.location.href = '../../profile/index.html';
            } else {
                this.showNotification('Ошибка при удалении проекта');
                this.hideDeleteConfirmation();
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            this.showNotification('Ошибка при удалении проекта');
            this.hideDeleteConfirmation();
        }
    }

    async loadTeamMembers() {
        try {
            const response = await fetch(`http://localhost:8080/api/connection/project/${this.currentProjectId}`);
            if (response.ok) {
                const connections = await response.json();
                await this.displayTeamMembers(connections);
            } else {
                this.showNotification('Ошибка загрузки команды');
            }
        } catch (error) {
            console.error('Error loading team members:', error);
            this.showNotification('Ошибка загрузки команды');
        }
    }

    async displayTeamMembers(connections) {
        const container = document.getElementById('teamGrid');
        container.innerHTML = '';

        // Фильтруем владельца из списка
        const filteredConnections = connections.filter(connection => 
            connection.role !== 'OWNER' || connection.userId !== this.currentUserId
        );

        if (filteredConnections.length === 0) {
            container.innerHTML = '<div class="message">В команде пока нет участников</div>';
        } else {
            for (const connection of filteredConnections) {
                try {
                    const user = await this.getUserById(connection.userId);
                    const card = this.createMemberCard(user, connection);
                    container.appendChild(card);
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            }
        }

        // Добавляем карточку создания
        const createCard = this.createAddMemberCard();
        container.appendChild(createCard);
    }

    async getUserById(userId) {
        const response = await fetch(`http://localhost:8080/api/users/${userId}`);
        if (response.ok) {
            return await response.json();
        }
        throw new Error('User not found');
    }

    createMemberCard(user, connection) {
        const card = document.createElement('div');
        card.className = 'member-card';
        
        const status = connection.accepted ? 'Принято' : 'Ожидание';
        
        card.innerHTML = `
            <button class="remove-btn" data-connection-id="${connection.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="member-username">${this.escapeHtml(user.username)}</div>
            <div class="member-role">${this.getRoleDisplayName(connection.role)}</div>
            <div class="member-status">${status}</div>
        `;
        
        card.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeMember(connection.id);
        });
        
        return card;
    }

    createAddMemberCard() {
        const card = document.createElement('div');
        card.className = 'member-card create';
        card.innerHTML = `
            <div class="create-icon">+</div>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = './invite_person/index.html';
        });
        
        return card;
    }

    async removeMember(connectionId) {
        if (confirm('Удалить участника из проекта?')) {
            try {
                const response = await fetch(`http://localhost:8080/api/connection/${connectionId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    await this.loadTeamMembers();
                } else {
                    this.showNotification('Ошибка при удалении участника');
                }
            } catch (error) {
                console.error('Error removing member:', error);
                this.showNotification('Ошибка при удалении участника');
            }
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SettingsPage();
});