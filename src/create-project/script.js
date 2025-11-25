class CreateProjectPage {
    constructor() {
        this.form = document.getElementById('createProjectForm');
        this.backBtn = document.getElementById('backBtn');
        this.createBtn = document.getElementById('createBtn');
        this.spinner = document.getElementById('spinner');
        this.btnText = this.createBtn.querySelector('.btn-text');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateProject();
        });
        
        this.backBtn.addEventListener('click', () => {
            window.location.href = '../projects/index.html';
        });
    }
    
    async handleCreateProject() {
        const formData = {
            name: document.getElementById('projectName').value.trim(),
            description: document.getElementById('projectDescription').value.trim(),
            channelUrl: document.getElementById('channelUrl').value.trim(),
            ownerId: localStorage.getItem('ownerId')
        };
        
        // Валидация
        if (!formData.name) {
            this.showError('Введите название канала');
            return;
        }
        
        this.setLoading(true);
        this.hideMessages();
        
        try {
            const response = await this.sendCreateRequest(formData);
            
            if (response.ok) {
                const projectData = await response.json();
                this.handleSuccess(projectData);
            } else {
                this.showError('Ошибка при создании проекта');
            }
        } catch (error) {
            console.error('Create project error:', error);
            this.showError('Ошибка соединения с сервером');
        } finally {
            this.setLoading(false);
        }
    }
    
    async sendCreateRequest(formData) {
        const token = localStorage.getItem('token');
        return fetch('http://localhost:8080/api/project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
    }
    
    handleSuccess(projectData) {
        this.showSuccess('Проект успешно создан! Перенаправление...');
        
        // Редирект обратно на страницу проектов через 2 секунды
        setTimeout(() => {
            window.location.href = '../projects/index.html';
        }, 2000);
    }
    
    setLoading(loading) {
        if (loading) {
            this.createBtn.disabled = true;
            this.btnText.classList.add('hidden');
            this.spinner.classList.remove('hidden');
        } else {
            this.createBtn.disabled = false;
            this.btnText.classList.remove('hidden');
            this.spinner.classList.add('hidden');
        }
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
        this.successMessage.classList.add('hidden');
    }
    
    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.classList.remove('hidden');
        this.errorMessage.classList.add('hidden');
    }
    
    hideMessages() {
        this.errorMessage.classList.add('hidden');
        this.successMessage.classList.add('hidden');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new CreateProjectPage();
});