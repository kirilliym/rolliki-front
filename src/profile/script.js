class ProfilePage {
    constructor() {
        this.currentUser = null;
        this.currentUserId = null;
        this.isEditMode = false;
        this.originalUsername = '';
        
        this.init();
    }
    
    async init() {
        await this.loadUserData();
        this.initEventListeners();
        await this.loadChannels();
    }
    
    async loadUserData() {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                this.currentUserId = this.currentUser.id;
                this.originalUsername = this.currentUser.username;
                this.updateUserDisplay();
            } else {
                window.location.href = '../../index.html';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            window.location.href = '../../index.html';
        }
    }
    
    updateUserDisplay() {
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay && this.currentUser) {
            usernameDisplay.textContent = this.currentUser.username;
        }
        
        const editUsername = document.getElementById('editUsername');
        if (editUsername && this.currentUser) {
            editUsername.value = this.currentUser.username;
        }
    }
    
    initEventListeners() {
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentProjectId');
            localStorage.removeItem('currentUserId');
            window.location.href = '../../index.html';
        });
        
        document.getElementById('editProfileBtn').addEventListener('click', () => {
            this.toggleEditMode(true);
        });
        
        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.toggleEditMode(false);
            this.resetForm();
        });
        
        document.getElementById('saveProfileBtn').addEventListener('click', () => {
            this.saveProfileChanges();
        });
        
        // Закрытие уведомления
        document.getElementById('notificationClose').addEventListener('click', () => {
            this.hideNotification();
        });
    }
    
    toggleEditMode(enable) {
        this.isEditMode = enable;
        const editSection = document.getElementById('editProfileSection');
        const formActions = document.getElementById('formActions');
        const body = document.body;
        
        if (enable) {
            editSection.classList.remove('hidden');
            formActions.classList.remove('hidden');
            body.classList.add('edit-mode');
            this.loadChannels(); // Перезагружаем каналы для режима редактирования
        } else {
            editSection.classList.add('hidden');
            formActions.classList.add('hidden');
            body.classList.remove('edit-mode');
            this.loadChannels(); // Возвращаем обычный вид
        }
    }
    
    resetForm() {
        document.getElementById('editUsername').value = this.originalUsername;
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
    }
    
    showNotification(message) {
        const notification = document.getElementById('notification');
        const messageElement = document.getElementById('notificationMessage');
        
        messageElement.textContent = message;
        notification.classList.remove('hidden');
        
        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }
    
    hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.add('hidden');
    }
    
    async saveProfileChanges() {
        const newUsername = document.getElementById('editUsername').value.trim();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        
        let changesMade = false;
        const errors = [];
        
        // Проверка изменения username
        if (newUsername !== this.originalUsername) {
            if (newUsername.length < 3) {
                errors.push('Имя пользователя должно содержать не менее 3 символов');
            } else {
                changesMade = true;
            }
        }
        
        // Проверка изменения пароля
        if (newPassword) {
            if (!currentPassword) {
                errors.push('Для изменения пароля введите текущий пароль');
            } else if (newPassword.length < 6) {
                errors.push('Новый пароль должен содержать не менее 6 символов');
            } else {
                changesMade = true;
            }
        }
        
        if (errors.length > 0) {
            this.showNotification(errors.join('\n'));
            return;
        }
        
        if (!changesMade) {
            this.toggleEditMode(false);
            return;
        }
        
        try {
            // Изменение username если нужно
            if (newUsername !== this.originalUsername) {
                const usernameResponse = await fetch(`http://localhost:8080/api/users/${this.currentUserId}/username`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        newUsername: newUsername
                    })
                });
                
                if (!usernameResponse.ok) {
                    throw new Error('Ошибка при изменении имени пользователя');
                }
                
                // Обновляем данные пользователя
                this.currentUser.username = newUsername;
                this.originalUsername = newUsername;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                this.updateUserDisplay();
            }
            
            // Изменение пароля если нужно
            if (newPassword && currentPassword) {
                const passwordResponse = await fetch(`http://localhost:8080/api/users/${this.currentUserId}/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    })
                });
                
                if (!passwordResponse.ok) {
                    throw new Error('Ошибка при изменении пароля. Проверьте текущий пароль.');
                }
            }
            
            this.toggleEditMode(false);
            this.resetForm();
            
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification(error.message || 'Ошибка при сохранении изменений');
        }
    }
    
    async loadChannels() {
        try {
            const [pendingResponse, acceptedResponse] = await Promise.all([
                fetch(`http://localhost:8080/api/connection/user/${this.currentUserId}/pending`),
                fetch(`http://localhost:8080/api/connection/user/${this.currentUserId}/accepted`)
            ]);
            
            const pendingInvitations = pendingResponse.ok ? await pendingResponse.json() : [];
            const acceptedChannels = acceptedResponse.ok ? await acceptedResponse.json() : [];
            
            this.displayChannels(pendingInvitations, acceptedChannels);
            
        } catch (error) {
            console.error('Error loading channels:', error);
            this.displayError();
        }
    }
    
    async displayChannels(pendingInvitations, acceptedChannels) {
        const container = document.getElementById('channelsGrid');
        container.innerHTML = '';
        
        // В режиме редактирования не показываем приглашения и кнопку создания
        if (!this.isEditMode) {
            // Карточки приглашений
            for (const invitation of pendingInvitations) {
                try {
                    const project = await this.getProjectById(invitation.projectId);
                    const card = this.createInvitationCard(invitation, project);
                    container.appendChild(card);
                } catch (error) {
                    console.error('Error loading project details:', error);
                }
            }
            
            // Карточки принятых каналов
            for (const connection of acceptedChannels) {
                try {
                    const project = await this.getProjectById(connection.projectId);
                    const card = this.createChannelCard(connection, project);
                    container.appendChild(card);
                } catch (error) {
                    console.error('Error loading project details:', error);
                }
            }
            
            // Карточка создания проекта
            const createCard = this.createCreateProjectCard();
            container.appendChild(createCard);
        } else {
            // В режиме редактирования показываем только принятые каналы с кнопкой выхода
            for (const connection of acceptedChannels) {
                try {
                    const project = await this.getProjectById(connection.projectId);
                    const card = this.createEditableChannelCard(connection, project);
                    container.appendChild(card);
                } catch (error) {
                    console.error('Error loading project details:', error);
                }
            }
            
            if (acceptedChannels.length === 0) {
                container.innerHTML = '<div class="message info">Нет каналов для редактирования</div>';
            }
        }
    }
    
    createInvitationCard(invitation, project) {
        const card = document.createElement('div');
        card.className = 'channel-card invitation';
        card.innerHTML = `
            <div class="channel-info">
                <h3>${this.escapeHtml(project.name)}</h3>
                <div class="channel-role">${this.getRoleDisplayName(invitation.role)}</div>
                <a href="${this.escapeHtml(project.url)}" class="channel-url" target="_blank" onclick="event.stopPropagation()">ссылка на канал</a>
            </div>
            <div class="invitation-actions">
                <button class="invitation-btn accept" data-connection-id="${invitation.id}">Принять</button>
                <button class="invitation-btn decline" data-connection-id="${invitation.id}">Отклонить</button>
            </div>
        `;
        
        card.querySelector('.invitation-btn.accept').addEventListener('click', (e) => {
            e.stopPropagation();
            this.acceptInvitation(invitation.id, invitation.userId, invitation.projectId);
        });
        
        card.querySelector('.invitation-btn.decline').addEventListener('click', (e) => {
            e.stopPropagation();
            this.declineInvitation(invitation.id, card);
        });
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.invitation-actions') && !e.target.closest('.channel-url')) {
                this.openChannel(project.id);
            }
        });
        
        return card;
    }
    
    createChannelCard(connection, project) {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <div class="channel-info">
                <h3>${this.escapeHtml(project.name)}</h3>
                <div class="channel-role">${this.getRoleDisplayName(connection.role)}</div>
                <a href="${this.escapeHtml(project.url)}" class="channel-url" target="_blank" onclick="event.stopPropagation()">ссылка на канал</a>
            </div>
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.channel-url')) {
                this.openChannel(project.id);
            }
        });
        
        return card;
    }
    
    createEditableChannelCard(connection, project) {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <div class="channel-actions">
                <button class="action-btn leave-btn" title="Выйти из канала" data-connection-id="${connection.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16,17 21,12 16,7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
            <div class="channel-info">
                <h3>${this.escapeHtml(project.name)}</h3>
                <div class="channel-role">${this.getRoleDisplayName(connection.role)}</div>
                <a href="${this.escapeHtml(project.url)}" class="channel-url" target="_blank" onclick="event.stopPropagation()">ссылка на канал</a>
            </div>
        `;
        
        card.querySelector('.leave-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.leaveChannel(connection.id);
        });
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.channel-actions') && !e.target.closest('.channel-url')) {
                this.openChannel(project.id);
            }
        });
        
        return card;
    }
    
    createCreateProjectCard() {
        const card = document.createElement('div');
        card.className = 'channel-card create';
        card.innerHTML = `
            <div class="create-icon">+</div>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = `../create_project/index.html?user_id=${this.currentUserId}`;
        });
        
        return card;
    }
    
    displayError() {
        const container = document.getElementById('channelsGrid');
        container.innerHTML = '<div class="message warning">Ошибка загрузки каналов</div>';
    }
    
    async getProjectById(projectId) {
        const response = await fetch(`http://localhost:8080/api/project/${projectId}`);
        if (response.ok) {
            return await response.json();
        }
        throw new Error('Project not found');
    }
    
    async acceptInvitation(connectionId, userId, projectId) {
        try {
            const response = await fetch(`http://localhost:8080/api/connection/accept/${userId}/${projectId}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                await this.loadChannels();
            } else {
                this.showNotification('Ошибка при принятии приглашения');
            }
        } catch (error) {
            console.error('Error accepting invitation:', error);
            this.showNotification('Ошибка при принятии приглашения');
        }
    }
    
    async declineInvitation(connectionId, cardElement) {
        try {
            cardElement.classList.add('declined');
            // Убираем кнопки
            const actions = cardElement.querySelector('.invitation-actions');
            if (actions) actions.remove();
            
            // Удаляем соединение на бэкенде
            await fetch(`http://localhost:8080/api/connection/${connectionId}`, {
                method: 'DELETE'
            });
            
        } catch (error) {
            console.error('Error declining invitation:', error);
            this.showNotification('Ошибка при отклонении приглашения');
        }
    }
    
    async leaveChannel(connectionId) {
        if (confirm('Вы уверены, что хотите выйти из канала?')) {
            try {
                const response = await fetch(`http://localhost:8080/api/connection/${connectionId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    await this.loadChannels();
                } else {
                    this.showNotification('Ошибка при выходе из канала');
                }
            } catch (error) {
                console.error('Error leaving channel:', error);
                this.showNotification('Ошибка при выходе из канала');
            }
        }
    }
    
    openChannel(projectId) {
        localStorage.setItem('currentProjectId', projectId);
        localStorage.setItem('currentUserId', this.currentUserId);
        window.location.href = `../project/videos/index.html?user_id=${this.currentUserId}&project_id=${projectId}`;
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new ProfilePage();
});