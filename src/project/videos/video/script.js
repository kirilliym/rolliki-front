class KanbanBoard {
    constructor() {
        this.currentProjectId = null;
        this.currentVideoId = null;
        this.currentUserId = null;
        this.currentUserRole = null;
        this.isOwner = false;
        this.availableRoles = [];
        this.stages = [];
        this.maxLevel = 0;
        this.currentStageForFiles = null;
        
        this.init();
    }

    async init() {
        await this.loadUserData();
        await this.loadProjectData();
        await this.loadVideoData();
        await this.loadUserRole();
        await this.loadAvailableRoles();
        await this.loadStages();
        this.initEventListeners();
        this.renderKanbanBoard();
    }

    async loadUserData() {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                this.currentUserId = user.id;
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
                window.location.href = '../../index.html';
                return;
            }

            const response = await fetch(`http://localhost:8080/api/project/${this.currentProjectId}`);
            if (response.ok) {
                const project = await response.json();
                document.getElementById('projectName').textContent = project.name;
            }
        } catch (error) {
            console.error('Error loading project data:', error);
            window.location.href = '../../index.html';
        }
    }

    async loadVideoData() {
        try {
            this.currentVideoId = localStorage.getItem('currentVideoId');
            if (!this.currentVideoId) {
                window.location.href = '../index.html';
                return;
            }

            const response = await fetch(`http://localhost:8080/api/video/${this.currentVideoId}`);
            if (response.ok) {
                const video = await response.json();
                document.getElementById('videoTitle').textContent = video.title;
                document.getElementById('videoDescription').textContent = video.description || 'Описание отсутствует';
            }
        } catch (error) {
            console.error('Error loading video data:', error);
            window.location.href = '../index.html';
        }
    }

    async loadUserRole() {
        try {
            const response = await fetch(`http://localhost:8080/api/connection/getrole/${this.currentProjectId}/${this.currentUserId}`);
            if (response.ok) {
                this.currentUserRole = await response.json();
                this.isOwner = this.currentUserRole === 'OWNER';
                
                if (this.isOwner) {
                    document.getElementById('ownerActions').classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Error loading user role:', error);
        }
    }

    async loadAvailableRoles() {
        try {
            const response = await fetch('http://localhost:8080/api/help/roles');
            if (response.ok) {
                this.availableRoles = await response.json();
                this.populateRoleSelect();
            }
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    }

    async loadStages() {
        try {
            const response = await fetch(`http://localhost:8080/api/stage/video/${this.currentVideoId}`);
            if (response.ok) {
                this.stages = await response.json();
                this.calculateMaxLevel();
                await this.checkStageAvailability();
            } else {
                this.showNotification('Ошибка загрузки стадий');
            }
        } catch (error) {
            console.error('Error loading stages:', error);
            this.showNotification('Ошибка загрузки стадий');
        }
    }

    calculateMaxLevel() {
        this.maxLevel = Math.max(...this.stages.map(stage => stage.level), 0);
    }

    async checkStageAvailability() {
        for (let level = 0; level <= this.maxLevel; level++) {
            if (level === 0) {
                // Уровень 0 всегда доступен
                this.stages.filter(stage => stage.level === level).forEach(stage => {
                    stage.available = true;
                });
            } else {
                // Проверяем, завершены ли все стадии предыдущего уровня
                const response = await fetch(`http://localhost:8080/api/stage/video/${this.currentVideoId}/level/${level-1}/completed`);
                if (response.ok) {
                    const allCompleted = await response.json();
                    this.stages.filter(stage => stage.level === level).forEach(stage => {
                        stage.available = allCompleted;
                    });
                }
            }
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

    initEventListeners() {
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = '../index.html';
        });

        document.getElementById('stageInfoClose').addEventListener('click', () => {
            this.hideStageInfoModal();
        });

        document.getElementById('uploadFilesClose').addEventListener('click', () => {
            this.hideUploadFilesModal();
        });

        document.getElementById('createStageClose').addEventListener('click', () => {
            this.hideCreateStageModal();
        });

        document.getElementById('saveFilesBtn').addEventListener('click', () => {
            this.saveFiles();
        });

        document.getElementById('createStageSubmitBtn').addEventListener('click', () => {
            this.createStage();
        });

        document.getElementById('addStageBtn').addEventListener('click', () => {
            this.showCreateStageModal();
        });

        document.getElementById('deleteVideoBtn').addEventListener('click', () => {
            this.showDeleteConfirmation();
        });

        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteVideo();
        });

        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.hideDeleteConfirmation();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.displaySelectedFiles(e.target.files);
        });

        document.getElementById('notificationClose').addEventListener('click', () => {
            this.hideNotification();
        });
    }

    renderKanbanBoard() {
        const kanbanBoard = document.getElementById('kanbanBoard');
        kanbanBoard.innerHTML = '';

        for (let level = 0; level <= this.maxLevel; level++) {
            const column = this.createColumn(level);
            kanbanBoard.appendChild(column);
        }
    }

    createColumn(level) {
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.innerHTML = `
            <div class="column-header">
                <h3>Уровень ${level}</h3>
            </div>
            <div class="stages-list" id="stages-level-${level}"></div>
        `;

        const stagesList = column.querySelector('.stages-list');
        const levelStages = this.stages.filter(stage => stage.level === level);

        levelStages.forEach(stage => {
            const stageCard = this.createStageCard(stage);
            stagesList.appendChild(stageCard);
        });

        return column;
    }

    createStageCard(stage) {
        const stageCard = document.createElement('div');
        
        let cardClass = 'stage-card';
        if (stage.completed) {
            cardClass += ' completed';
        } else if (!stage.available) {
            cardClass += ' disabled';
        }

        stageCard.className = cardClass;
        stageCard.innerHTML = `
            <div class="stage-actions">
                ${this.isOwner ? `
                    <button class="action-btn delete-stage-btn" data-stage-id="${stage.id}" title="Удалить стадию">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                ` : ''}
                ${this.canEditStage(stage) ? `
                    <button class="action-btn edit-stage-btn" data-stage-id="${stage.id}" title="Загрузить файлы">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                ` : ''}
            </div>
            <h4>${this.escapeHtml(stage.title)}</h4>
            <p>${this.escapeHtml(stage.description || 'Описание отсутствует')}</p>
            <p><small>Роль: ${this.getRoleDisplayName(stage.requiredRole)}</small></p>
        `;

        if (!stage.disabled) {
            stageCard.addEventListener('click', () => {
                this.showStageInfo(stage);
            });
        }

        // Обработчики для кнопок действий
        if (this.isOwner) {
            stageCard.querySelector('.delete-stage-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteStage(stage.id);
            });
        }

        if (this.canEditStage(stage)) {
            stageCard.querySelector('.edit-stage-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showUploadFilesModal(stage);
            });
        }

        return stageCard;
    }

    canEditStage(stage) {
        if (stage.completed || !stage.available) {
            return false;
        }
        
        return this.isOwner || this.currentUserRole === stage.requiredRole;
    }

    async showStageInfo(stage) {
        document.getElementById('stageInfoTitle').textContent = stage.title;
        document.getElementById('stageInfoDescription').textContent = stage.description || 'Описание отсутствует';
        document.getElementById('stageInfoRole').textContent = this.getRoleDisplayName(stage.requiredRole);
        
        // Загрузка информации о зависимости
        if (stage.dependsOnStageId) {
            const dependentStage = this.stages.find(s => s.id === stage.dependsOnStageId);
            document.getElementById('stageInfoDependency').textContent = dependentStage ? dependentStage.title : 'Неизвестная стадия';
        } else {
            document.getElementById('stageInfoDependency').textContent = 'Не зависит';
        }

        // Статус
        let statusText = '';
        if (stage.completed) {
            statusText = 'Завершена';
        } else if (stage.available) {
            statusText = 'В процессе';
        } else {
            statusText = 'Недоступна';
        }
        document.getElementById('stageInfoStatus').textContent = statusText;

        // Загрузка файлов
        await this.loadStageFiles(stage.id);

        document.getElementById('stageInfoModal').classList.remove('hidden');
    }

    async loadStageFiles(stageId) {
        const filesList = document.getElementById('stageInfoFiles');
        filesList.innerHTML = '';

        try {
            const response = await fetch(`/api/file/${stageId}`);
            if (response.ok) {
                const files = await response.json();
                if (files.length === 0) {
                    filesList.innerHTML = '<p>Файлы отсутствуют</p>';
                } else {
                    files.forEach(file => {
                        const fileItem = document.createElement('div');
                        fileItem.className = 'file-item';
                        fileItem.innerHTML = `
                            <span class="file-name">${this.escapeHtml(file.name)}</span>
                            <button class="download-btn" data-file-id="${file.id}">Скачать</button>
                        `;
                        filesList.appendChild(fileItem);
                    });

                    // Добавляем обработчики для кнопок скачивания
                    filesList.querySelectorAll('.download-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.downloadFile(e.target.dataset.fileId);
                        });
                    });
                }
            } else {
                filesList.innerHTML = '<p>Ошибка загрузки файлов</p>';
            }
        } catch (error) {
            console.error('Error loading files:', error);
            filesList.innerHTML = '<p>Ошибка загрузки файлов</p>';
        }
    }

    async downloadFile(fileId) {
        try {
            const response = await fetch(`/api/file/download/${fileId}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `file-${fileId}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                this.showNotification('Ошибка при скачивании файла');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            this.showNotification('Ошибка при скачивании файла');
        }
    }

    showUploadFilesModal(stage) {
        this.currentStageForFiles = stage;
        document.getElementById('selectedFiles').innerHTML = '';
        document.getElementById('fileInput').value = '';
        document.getElementById('uploadFilesModal').classList.remove('hidden');
    }

    displaySelectedFiles(files) {
        const selectedFiles = document.getElementById('selectedFiles');
        selectedFiles.innerHTML = '';

        Array.from(files).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'selected-file';
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            `;
            selectedFiles.appendChild(fileItem);
        });
    }

    async saveFiles() {
        const files = document.getElementById('fileInput').files;
        
        if (files.length === 0) {
            this.showNotification('Выберите файлы для загрузки');
            return;
        }

        const formData = new FormData();
        formData.append('stageId', this.currentStageForFiles.id);
        
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });

        try {
            // Пытаемся отправить файлы на сервер
            const response = await fetch('/api/file/savefiles', {
                method: 'POST',
                body: formData
            });

            // Независимо от результата отправки файлов, помечаем стадию как завершенную
            await fetch(`http://localhost:8080/api/stage/${this.currentStageForFiles.id}/complete`, {
                method: 'POST'
            });

            if (response.ok) {
                this.showNotification('Файлы успешно загружены и стадия завершена');
            } else {
                this.showNotification('Стадия завершена, но возникли проблемы с загрузкой файлов');
            }

            this.hideUploadFilesModal();
            await this.reloadData();
        } catch (error) {
            console.error('Error saving files:', error);
            // Все равно помечаем стадию как завершенную
            await fetch(`http://localhost:8080/api/stage/${this.currentStageForFiles.id}/complete`, {
                method: 'POST'
            });
            
            this.showNotification('Стадия завершена, но возникли проблемы с загрузкой файлов');
            this.hideUploadFilesModal();
            await this.reloadData();
        }
    }

    showCreateStageModal() {
        this.populateDependencySelect();
        document.getElementById('newStageTitle').value = '';
        document.getElementById('newStageDescription').value = '';
        document.getElementById('newStageRole').value = '';
        document.getElementById('newStageDependency').value = '';
        document.getElementById('createStageModal').classList.remove('hidden');
    }

    populateDependencySelect() {
        const dependencySelect = document.getElementById('newStageDependency');
        dependencySelect.innerHTML = '<option value="">Не зависит</option>';
        
        this.stages.forEach(stage => {
            const option = document.createElement('option');
            option.value = stage.id;
            option.textContent = stage.title;
            dependencySelect.appendChild(option);
        });
    }

    async createStage() {
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

        try {
            const response = await fetch('http://localhost:8080/api/stage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoId: this.currentVideoId,
                    title: title,
                    description: description,
                    requiredRole: role,
                    dependsOnStageId: dependency || null
                    // Уровень определяется на бекенде автоматически
                })
            });

            if (response.ok) {
                this.showNotification('Стадия успешно создана');
                this.hideCreateStageModal();
                await this.reloadData();
            } else {
                this.showNotification('Ошибка при создании стадии');
            }
        } catch (error) {
            console.error('Error creating stage:', error);
            this.showNotification('Ошибка при создании стадии');
        }
    }

    showDeleteConfirmation() {
        document.getElementById('confirmDeleteModal').classList.remove('hidden');
    }

    hideDeleteConfirmation() {
        document.getElementById('confirmDeleteModal').classList.add('hidden');
    }

    async deleteVideo() {
        try {
            const response = await fetch(`http://localhost:8080/api/video/${this.currentVideoId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Видео успешно удалено');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);
            } else {
                this.showNotification('Ошибка при удалении видео');
            }
        } catch (error) {
            console.error('Error deleting video:', error);
            this.showNotification('Ошибка при удалении видео');
        }
    }

    async deleteStage(stageId) {
        if (!confirm('Вы уверены, что хотите удалить эту стадию?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/stage/${stageId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Стадия успешно удалена');
                await this.reloadData();
            } else {
                this.showNotification('Ошибка при удалении стадии');
            }
        } catch (error) {
            console.error('Error deleting stage:', error);
            this.showNotification('Ошибка при удалении стадии');
        }
    }

    async reloadData() {
        await this.loadStages();
        this.renderKanbanBoard();
    }

    hideStageInfoModal() {
        document.getElementById('stageInfoModal').classList.add('hidden');
    }

    hideUploadFilesModal() {
        document.getElementById('uploadFilesModal').classList.add('hidden');
        this.currentStageForFiles = null;
    }

    hideCreateStageModal() {
        document.getElementById('createStageModal').classList.add('hidden');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
    new KanbanBoard();
});