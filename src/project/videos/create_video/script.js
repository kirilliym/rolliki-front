class CreateVideoPage {
    constructor() {
        this.currentProjectId = null;
        this.currentProject = null;
        this.currentVideoId = null;
        this.availableRoles = [];
        this.existingVideos = [];
        this.createdStages = [];
        
        this.init();
    }

    async init() {
        await this.loadProjectData();
        await this.loadAvailableRoles();
        await this.loadExistingVideos();
        this.initEventListeners();
    }

    async loadProjectData() {
        try {
            this.currentProjectId = localStorage.getItem('currentProjectId');
            if (!this.currentProjectId) {
                window.location.href = '../../index.html';
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
            window.location.href = '../../index.html';
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
                this.populateRoleSelect();
            } else {
                this.showNotification('Ошибка загрузки списка ролей');
            }
        } catch (error) {
            console.error('Error loading roles:', error);
            this.showNotification('Ошибка загрузки списка ролей');
        }
    }

    async loadExistingVideos() {
        try {
            const response = await fetch(`http://localhost:8080/api/video/project/${this.currentProjectId}`);
            if (response.ok) {
                this.existingVideos = await response.json();
                this.populateVideoSelect();
            }
        } catch (error) {
            console.error('Error loading videos:', error);
        }
    }

    populateRoleSelect() {
        const roleSelect = document.getElementById('newStageRole');
        roleSelect.innerHTML = '<option value="">Выберите роль</option>';
        
        this.availableRoles.forEach(role => {
            if (role !== 'OWNER') {
                const option = document.createElement('option');
                option.value = role;
                option.textContent = this.getRoleDisplayName(role);
                roleSelect.appendChild(option);
            }
        });
    }

    populateVideoSelect() {
        const videoSelect = document.getElementById('sourceVideoSelect');
        videoSelect.innerHTML = '<option value="">Выберите видео</option>';
        
        this.existingVideos.forEach(video => {
            const option = document.createElement('option');
            option.value = video.id;
            option.textContent = video.title;
            videoSelect.appendChild(option);
        });
    }

    initEventListeners() {
        document.getElementById('nextStageBtn').addEventListener('click', () => {
            this.goToStage2();
        });

        document.getElementById('prevStageBtn').addEventListener('click', () => {
            this.goToStage1();
        });

        // Обработчики для радиокнопок
        document.querySelectorAll('input[name="creationMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleMethodChange(e.target.value);
            });
        });

        document.getElementById('addStageBtn').addEventListener('click', () => {
            this.addStage();
        });

        document.getElementById('createVideoBtn').addEventListener('click', () => {
            this.createVideoWithStages();
        });

        document.getElementById('notificationClose').addEventListener('click', () => {
            this.hideNotification();
        });
    }

    async goToStage2() {
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

        try {
            // Создаем видео
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
                this.currentVideoId = videoData.id;
                localStorage.setItem('currentVideoId', this.currentVideoId);
                
                // Переходим ко второй стадии
                document.getElementById('stage1').classList.remove('active');
                document.getElementById('stage2').classList.add('active');
                document.getElementById('step1').classList.remove('active');
                document.getElementById('step2').classList.add('active');
                
            } else {
                this.showNotification('Ошибка при создании видео');
            }
        } catch (error) {
            console.error('Error creating video:', error);
            this.showNotification('Ошибка при создании видео');
        }
    }

    goToStage1() {
        document.getElementById('stage2').classList.remove('active');
        document.getElementById('stage1').classList.add('active');
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step1').classList.add('active');
    }

    handleMethodChange(method) {
        // Скрываем все опции
        document.getElementById('copyOption').classList.add('hidden');
        document.getElementById('createOption').classList.add('hidden');

        if (method === 'copy') {
            document.getElementById('copyOption').classList.remove('hidden');
        } else if (method === 'create') {
            document.getElementById('createOption').classList.remove('hidden');
            this.initializeCreateOption();
        }
    }

    initializeCreateOption() {
        // Очищаем список стадий
        const stagesList = document.getElementById('stagesList');
        stagesList.innerHTML = '';
        
        // Добавляем карточку создания
        const createCard = document.getElementById('createStageCard');
        stagesList.appendChild(createCard);
        
        // Загружаем зависимости для новых стадий
        this.loadStagesForDependency();
    }

    async loadStagesForDependency() {
        const dependencySelect = document.getElementById('newStageDependency');
        dependencySelect.innerHTML = '<option value="">Не зависит от других стадий</option>';

        if (this.createdStages.length > 0) {
            this.createdStages.forEach(stage => {
                const option = document.createElement('option');
                option.value = stage.id;
                option.textContent = stage.title;
                dependencySelect.appendChild(option);
            });
        }
    }

    async addStage() {
        const title = document.getElementById('newStageTitle').value.trim();
        const description = document.getElementById('newStageDescription').value.trim();
        const role = document.getElementById('newStageRole').value;
        const dependency = document.getElementById('newStageDependency').value;

        if (!title) {
            this.showNotification('Введите название стадии');
            return;
        }

        if (!role) {
            this.showNotification('Выберите роль');
            return;
        }

        const stageData = {
            videoId: this.currentVideoId,
            title: title,
            description: description,
            requiredRole: role,
            dependsOnStageId: dependency || null
        };

        try {
            const response = await fetch('http://localhost:8080/api/stage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(stageData)
            });

            if (response.ok) {
                const stage = await response.json();
                this.createdStages.push(stage);
                this.displayStage(stage);
                this.clearStageForm();
                await this.loadStagesForDependency();
            } else {
                this.showNotification('Ошибка при создании стадии');
            }
        } catch (error) {
            console.error('Error creating stage:', error);
            this.showNotification('Ошибка при создании стадии');
        }
    }

    displayStage(stage) {
        const stagesList = document.getElementById('stagesList');
        const stageCard = document.createElement('div');
        stageCard.className = 'stage-card';
        stageCard.innerHTML = `
            <button class="remove-stage-btn" data-stage-id="${stage.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="stage-card-content">
                <h3>${this.escapeHtml(stage.title)}</h3>
                <p>${this.escapeHtml(stage.description || 'Описание отсутствует')}</p>
                <div class="stage-meta">
                    <span class="stage-role">Роль: ${this.getRoleDisplayName(stage.requiredRole)}</span>
                    ${stage.dependsOnStageId ? '<span class="stage-dependency">Зависит от другой стадии</span>' : ''}
                </div>
            </div>
        `;

        stageCard.querySelector('.remove-stage-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeStage(stage.id, stageCard);
        });

        // Вставляем перед карточкой создания
        const createCard = document.getElementById('createStageCard');
        stagesList.insertBefore(stageCard, createCard);
    }

    async removeStage(stageId, stageElement) {
        if (confirm('Удалить эту стадию?')) {
            try {
                const response = await fetch(`http://localhost:8080/api/stage/${stageId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    stageElement.remove();
                    this.createdStages = this.createdStages.filter(stage => stage.id !== stageId);
                    await this.loadStagesForDependency();
                } else {
                    this.showNotification('Ошибка при удалении стадии');
                }
            } catch (error) {
                console.error('Error removing stage:', error);
                this.showNotification('Ошибка при удалении стадии');
            }
        }
    }

    clearStageForm() {
        document.getElementById('newStageTitle').value = '';
        document.getElementById('newStageDescription').value = '';
        document.getElementById('newStageRole').value = '';
        document.getElementById('newStageDependency').value = '';
    }

    async createVideoWithStages() {
        const selectedMethod = document.querySelector('input[name="creationMethod"]:checked');
        
        if (!selectedMethod) {
            this.showNotification('Выберите способ создания этапов');
            return;
        }

        const method = selectedMethod.value;
        const createBtn = document.getElementById('createVideoBtn');
        createBtn.disabled = true;
        createBtn.textContent = 'Создание...';

        try {
            if (method === 'copy') {
                const sourceVideoId = document.getElementById('sourceVideoSelect').value;
                if (!sourceVideoId) {
                    this.showNotification('Выберите видео для копирования');
                    return;
                }
                await this.copyStagesFromVideo(sourceVideoId);
            }

            // Перенаправляем на страницу видео
            window.location.href = `../video/index.html`;

        } catch (error) {
            console.error('Error creating video with stages:', error);
            this.showNotification('Ошибка при создании видео');
        } finally {
            createBtn.disabled = false;
            createBtn.textContent = 'Создать видео';
        }
    }

    async copyStagesFromVideo(sourceVideoId) {
        try {
            const response = await fetch(`http://localhost:8080/api/stage/video/${sourceVideoId}`);
            if (response.ok) {
                const stages = await response.json();
                
                for (const stage of stages) {
                    await fetch('http://localhost:8080/api/stage', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            videoId: this.currentVideoId,
                            title: stage.title,
                            description: stage.description,
                            requiredRole: stage.requiredRole,
                            dependsOnStageId: stage.dependsOnStageId
                        })
                    });
                }
            } else {
                throw new Error('Ошибка при копировании стадий');
            }
        } catch (error) {
            console.error('Error copying stages:', error);
            throw error;
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
    new CreateVideoPage();
});