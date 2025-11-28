class CreateVideoStage1 {
    constructor() {
        this.currentProjectId = null;
        this.currentProject = null;
        
        this.init();
    }

    async init() {
        await this.loadProjectData();
        this.initEventListeners();
    }

    async loadProjectData() {
        try {
            this.currentProjectId = localStorage.getItem('currentProjectId');
            if (!this.currentProjectId) {
                window.location.href = '../../../../index.html';
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
            window.location.href = '../../../../index.html';
        }
    }

    updateProjectDisplay() {
        const projectNameElement = document.getElementById('projectName');
        if (projectNameElement && this.currentProject) {
            projectNameElement.textContent = this.currentProject.name;
        }
    }

    initEventListeners() {
        document.getElementById('nextStageBtn').addEventListener('click', () => {
            this.createVideoAndProceed();
        });

        document.getElementById('notificationClose').addEventListener('click', () => {
            this.hideNotification();
        });

        document.getElementById('videoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createVideoAndProceed();
        });
    }

    async createVideoAndProceed() {
        const title = document.getElementById('videoTitle').value.trim();
        const description = document.getElementById('videoDescription').value.trim();
        const deadline = document.getElementById('videoDeadline').value;

        if (!title) {
            this.showNotification('Введите название видео');
            return;
        }

        if (!deadline) {
            this.showNotification('Выберите дедлайн');
            return;
        }

        const nextBtn = document.getElementById('nextStageBtn');
        nextBtn.disabled = true;
        nextBtn.textContent = 'Создание...';

        try {
            const response = await fetch('http://localhost:8080/api/video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: this.currentProjectId,
                    title: title,
                    description: description,
                    deadline: deadline
                })
            });

            if (response.ok) {
                const videoData = await response.json();
                localStorage.setItem('currentVideoId', videoData.id);
                
                // Переходим ко второй стадии
                window.location.href = '../stage2/index.html';
                
            } else {
                this.showNotification('Ошибка при создании видео');
            }
        } catch (error) {
            console.error('Error creating video:', error);
            this.showNotification('Ошибка при создании видео');
        } finally {
            nextBtn.disabled = false;
            nextBtn.textContent = 'Далее';
        }
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
}

document.addEventListener('DOMContentLoaded', () => {
    new CreateVideoStage1();
});