class VideosPage {
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
        await this.loadVideos();
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
            // Уже на этой странице
        });

        document.getElementById('teamBtn').addEventListener('click', () => {
            window.location.href = '../team/index.html';
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

    async loadVideos() {
        try {
            const response = await fetch(`http://localhost:8080/api/video/project/${this.currentProjectId}`);
            if (response.ok) {
                const videos = await response.json();
                this.displayVideos(videos);
            } else {
                this.showNotification('Ошибка загрузки видео');
            }
        } catch (error) {
            console.error('Error loading videos:', error);
            this.showNotification('Ошибка загрузки видео');
        }
    }

    displayVideos(videos) {
        const container = document.getElementById('videosGrid');
        
        if (videos.length === 0 && this.userRole !== 'OWNER') {
            container.innerHTML = '<div class="message">В этом проекте пока нет видео</div>';
            return;
        }

        container.innerHTML = '';
        
        videos.forEach(video => {
            const card = this.createVideoCard(video);
            container.appendChild(card);
        });

        if (this.userRole === 'OWNER') {
            const createCard = this.createCreateVideoCard();
            container.appendChild(createCard);
        }
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = `video-card ${video.status.toLowerCase().replace('_', '-')}`;
        
        const createdAt = this.formatDate(video.createdAt);
        const deadline = this.formatDate(video.deadline);
        
        card.innerHTML = `
            <div class="video-info">
                <h3>${this.escapeHtml(video.title)}</h3>
                <div class="video-meta">
                    <div class="video-date">
                        <span>Создано:</span>
                        <span>${createdAt}</span>
                    </div>
                    <div class="video-date">
                        <span>Дедлайн:</span>
                        <span>${deadline}</span>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${video.completionPercentage}%"></div>
                    <span class="progress-text">${video.completionPercentage}%</span>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.openVideo(video.id);
        });
        
        return card;
    }

    createCreateVideoCard() {
        const card = document.createElement('div');
        card.className = 'video-card create';
        card.innerHTML = `
            <div class="create-icon">+</div>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = './create_video/stage1/index.html';
        });
        
        return card;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Некорректная дата';
        }
    }

    openVideo(videoId) {
        localStorage.setItem('currentVideoId', videoId);
        window.location.href = './video/index.html';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VideosPage();
});