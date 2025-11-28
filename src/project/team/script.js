class TeamPage {
    constructor() {
        this.currentUser = null;
        this.currentUserId = null;
        this.currentProjectId = null;
        this.currentProject = null;
        this.userRole = null;
        
        this.init();
    }

    async init() {
        await this.loadUserData();
        await this.loadProjectData();
        await this.checkUserRole();
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
                this.updateProjectDisplay();
            } else {
                this.showNotification('Ошибка загрузки данных проекта');
            }
        } catch (error) {
            console.error('Error loading project data:', error);
            this.showNotification('Ошибка загрузки данных проекта');
        }
    }

    async checkUserRole() {
        try {
            const response = await fetch(`http://localhost:8080/api/connection/getrole/${this.currentProjectId}/${this.currentUserId}`);
            if (response.ok) {
                this.userRole = await response.json();
                this.updateNavigation();
            }
        } catch (error) {
            console.error('Error checking user role:', error);
        }
    }

    updateProjectDisplay() {
        const projectNameElement = document.getElementById('projectName');
        if (projectNameElement && this.currentProject) {
            projectNameElement.textContent = this.currentProject.name;
        }
    }

    updateNavigation() {
        if (this.userRole === 'OWNER') {
            document.getElementById('settingsBtn').classList.remove('hidden');
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
            // Уже на этой странице
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            window.location.href = '../settings/index.html';
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

    async loadTeamMembers() {
        try {
            const response = await fetch(`http://localhost:8080/api/connection/project/${this.currentProjectId}/accepted`);
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
        
        if (connections.length === 0) {
            container.innerHTML = '<div class="message">В команде пока нет участников</div>';
            return;
        }

        container.innerHTML = '';
        
        for (const connection of connections) {
            try {
                const user = await this.getUserById(connection.userId);
                const card = this.createMemberCard(user, connection);
                container.appendChild(card);
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        }
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
        
        card.innerHTML = `
            <div class="member-username">${this.escapeHtml(user.username)}</div>
            <div class="member-role">${this.getRoleDisplayName(connection.role)}</div>
        `;
        
        card.addEventListener('click', () => {
            this.openChat(user.id);
        });
        
        return card;
    }

    openChat(userId) {
        localStorage.setItem('chatUserId', userId);
        window.location.href = '../../../chat/index.html';
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
    new TeamPage();
});